import { Component, signal, computed } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import {environment} from '../../../environments/environment';

export interface HistoryEntry {
    id?: number;
    productId: number;
    productName: string;
    category: string;
    action: 'consume' | 'discard' | 'add';
    quantity: number;
    date: string; // ISO
}

@Component({
    selector: 'fs-reports-view',
    standalone: true,
    imports: [
        NgIf,
        NgFor,
        FormsModule,
        TranslateModule,
        DatePipe
    ],
    templateUrl: './reports.view.html',
    styleUrls: ['./reports.view.css']
})
export class ReportsView {

    private readonly historyUrl = `${environment.apiBaseUrl}/history`;

    constructor(private http: HttpClient) {
        this.loadHistory();
    }

    humidity = [70, 72, 68, 66, 71, 73, 69];
    temperature = [19, 21, 22, 20, 23, 24, 22].map((v) => v * 4);
    width = 640;
    height = 220;
    pad = 28;

    xScale = (idx: number) =>
        this.pad +
        idx * ((this.width - this.pad * 2) / (this.humidity.length - 1));

    yScale = (v: number) =>
        this.height - this.pad - (v / 100) * (this.height - this.pad * 2);

    polyline = (arr: number[]) =>
        arr
            .map((v, idx) => `${this.xScale(idx)},${this.yScale(v)}`)
            .join(' ');

    gainPct = 12;
    lossPct = 3;
    improvementPct = 12;

    fromDate = '2025-08-11';
    toDate = '2025-08-17';

    applyRange() {
        console.log('Range applied:', this.fromDate, 'to', this.toDate);
    }

    private _days = signal([
        { label: 'Mon', wasteKg: 12 },
        { label: 'Tue', wasteKg: 18 },
        { label: 'Wed', wasteKg: 9 },
        { label: 'Thu', wasteKg: 14 },
        { label: 'Fri', wasteKg: 20 },
        { label: 'Sat', wasteKg: 16 },
        { label: 'Sun', wasteKg: 10 },
    ]);

    readonly days = computed(() => this._days());
    readonly maxWaste = Math.max(
        ...this._days().map((d) => d.wasteKg)
    );

    history: HistoryEntry[] = [];
    filtered: HistoryEntry[] = [];

    hFrom?: string;
    hTo?: string;
    hAction: '' | 'consume' | 'discard' | 'add' = '';
    hCategory: string = '';

    loadHistory(): void {
        this.http.get<HistoryEntry[]>(this.historyUrl)
            .subscribe({
                next: (data) => {
                    this.history = data ?? [];
                    this.applyHistoryFilters();
                },
                error: () => {
                    console.warn('No se pudo cargar historial; usando arreglo vacío.');
                    this.history = [];
                    this.filtered = [];
                }
            });
    }

    applyHistoryFilters(): void {
        const fromT = this.hFrom ? new Date(this.hFrom).getTime() : -Infinity;
        const toT   = this.hTo   ? new Date(this.hTo).getTime()   : Infinity;

        this.filtered = (this.history || [])
            .filter((e) => {
                const t = new Date(e.date).getTime();
                const okAction =
                    !this.hAction || e.action === this.hAction;
                const okCategory =
                    !this.hCategory ||
                    (e.category?.toLowerCase() === this.hCategory.toLowerCase());
                const okDate = t >= fromT && t <= toT;
                return okAction && okCategory && okDate;
            })
            .sort(
                (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
            );
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
            .map((r) =>
                r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
            )
            .join('\n');

        const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = 'consumption-history.csv';
        a.click();

        URL.revokeObjectURL(url);
    }
}
