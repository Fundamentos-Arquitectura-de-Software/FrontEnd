import { Component, signal, computed, DestroyRef, inject } from '@angular/core';
// signal/computed used for _days and days()
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { HistoryEntry } from '../domain/history.model';
import { MonitoringApi } from '../../monitoring/infrastructure/monitoring-api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Component({
    selector: 'fs-reports-view',
    standalone: true,
    imports: [NgIf, NgFor, NgClass, FormsModule, TranslateModule, DatePipe],
    templateUrl: './reports.view.html',
    styleUrls: ['./reports.view.css']
})
export class ReportsView {

    private readonly historyUrl = `${environment.apiBaseUrl}/history`;
    private destroyRef = inject(DestroyRef);

    constructor(private http: HttpClient, private monitoringApi: MonitoringApi) {
        this.loadHistory();
        this.loadTrends();
    }

    private loadTrends(): void {
        this.monitoringApi.getAll()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (readings) => {
                    // Últimas ~20 lecturas, en orden cronológico.
                    const last = (readings ?? [])
                        .slice()
                        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
                        .slice(-20);
                    this.temperature = last.map(r => Number(r.temperature ?? 0));
                    this.humidity = last.map(r => Number(r.humidity ?? 0));
                },
                error: () => {
                    this.temperature = [];
                    this.humidity = [];
                }
            });
    }

    // --- Trends chart (requires real sensor data — shown empty until monitoring available) ---
    humidity: number[] = [];
    temperature: number[] = [];
    width = 640;
    height = 220;
    pad = 28;

    xScale = (idx: number) =>
        this.pad + idx * ((this.width - this.pad * 2) / (Math.max(this.humidity.length - 1, 1)));

    yScale = (v: number) =>
        this.height - this.pad - (v / 100) * (this.height - this.pad * 2);

    polyline = (arr: number[]) =>
        arr.map((v, idx) => `${this.xScale(idx)},${this.yScale(v)}`).join(' ');

    hasTrends = computed(() => this.humidity.length > 0);

    // --- KPIs derived from history ---
    gainPct = 0;
    lossPct = 0;
    improvementPct = 0;

    fromDate = '';
    toDate = '';

    applyRange() {
        this.applyHistoryFilters();
    }

    private _days = signal<{ label: string; wasteKg: number }[]>([]);
    readonly days = computed(() => this._days());
    get maxWaste(): number {
        const vals = this._days().map(d => d.wasteKg);
        return vals.length ? Math.max(...vals) : 1;
    }

    history: HistoryEntry[] = [];
    filtered: HistoryEntry[] = [];

    hFrom?: string;
    hTo?: string;
    hAction: '' | 'consume' | 'discard' | 'add' = '';
    hCategory: string = '';

    loadHistory(): void {
        this.http.get<HistoryEntry[]>(this.historyUrl)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    this.history = data ?? [];
                    this.computeWeeklyWaste();
                    this.computeKpis();
                    this.applyHistoryFilters();
                },
                error: () => {
                    this.history = [];
                    this.filtered = [];
                }
            });
    }

    private computeWeeklyWaste(): void {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 6);

        const wasteByDay: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            wasteByDay[d.toDateString()] = 0;
        }

        this.history
            .filter(e => this.isAction(e.action, 'discard'))
            .forEach(e => {
                const d = new Date(e.date).toDateString();
                if (wasteByDay[d] !== undefined) {
                    wasteByDay[d] += e.quantity ?? 0;
                }
            });

        const days = Object.entries(wasteByDay).map(([dateStr, wasteKg]) => ({
            label: DAY_LABELS[new Date(dateStr).getDay()],
            wasteKg
        }));
        this._days.set(days);
    }

    /** Acepta tanto el formato nuevo (CONSUMED/DISCARDED) como el antiguo (consume/discard). */
    private isAction(value: string | undefined, kind: 'consume' | 'discard'): boolean {
        const v = (value ?? '').toLowerCase();
        return kind === 'consume' ? (v === 'consumed' || v === 'consume')
                                  : (v === 'discarded' || v === 'discard');
    }

    private computeKpis(): void {
        const consumed = this.history
            .filter(e => this.isAction(e.action, 'consume'))
            .reduce((acc, e) => acc + (e.quantity ?? 0), 0);
        const discarded = this.history
            .filter(e => this.isAction(e.action, 'discard'))
            .reduce((acc, e) => acc + (e.quantity ?? 0), 0);
        const total = consumed + discarded;

        this.gainPct = total > 0 ? Math.round((consumed / total) * 100) : 0;
        this.lossPct = total > 0 ? Math.round((discarded / total) * 100) : 0;
        this.improvementPct = this.gainPct - this.lossPct;
    }

    applyHistoryFilters(): void {
        const fromT = this.hFrom ? new Date(this.hFrom).getTime() : -Infinity;
        const toT   = this.hTo   ? new Date(this.hTo).getTime()   : Infinity;

        this.filtered = (this.history || [])
            .filter((e) => {
                const t = new Date(e.date).getTime();
                const okAction   = !this.hAction
                    || (this.hAction === 'add' ? e.action === 'add' : this.isAction(e.action, this.hAction as 'consume' | 'discard'));
                const okCategory = !this.hCategory || (e.category?.toLowerCase() === this.hCategory.toLowerCase());
                const okDate     = t >= fromT && t <= toT;
                return okAction && okCategory && okDate;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    exportCSV(): void {
        const rows = [
            ['date', 'action', 'productName', 'category', 'quantity'],
            ...this.filtered.map((e) => [
                new Date(e.date).toISOString(),
                e.action,
                e.productName,
                e.category,
                String(e.quantity ?? '')
            ])
        ];

        const csv = rows
            .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'consumption-history.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
}
