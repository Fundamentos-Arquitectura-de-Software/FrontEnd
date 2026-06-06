import { Component, OnInit, computed, signal, inject, DestroyRef } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MonitoringApi } from '../infrastructure/monitoring-api';
import { MonitoringReading } from '../domain/monitoring-reading.model';

type Category = 'Environment' | 'Quality' | 'Safety';

interface MetricCard {
    id: string;
    kind: 'metric' | 'progress';
    title: string;
    value?: string;
    valuePct?: number;
    subtitle?: string;
    category: Category;
    unit?: string;
    trend?: number[];
    warnAbove?: number;
    critAbove?: number;
}

@Component({
    selector: 'fs-monitoring-view',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, TranslateModule],
    templateUrl: './monitoring.view.html',
    styleUrls: ['./monitoring.view.css'],
})
export class MonitoringView implements OnInit {
    private readonly api = inject(MonitoringApi);
    private readonly destroyRef = inject(DestroyRef);

    lastMonitoringDate = '—';
    lastSync = '—';
    private _lastSyncMinutes = 0;
    get lastSyncMinutes() { return this._lastSyncMinutes; }

    categories: (Category | 'All')[] = ['All', 'Environment', 'Quality', 'Safety'];
    activeCategory = signal<Category | 'All'>('All');

    private allCards = signal<MetricCard[]>([]);
    loading = signal(true);
    noData = signal(false);

    readonly kpi = {
        issues: computed(() =>
            this.allCards().filter(c =>
                (c.id === 'temp' && Number(c.value) >= (c.warnAbove ?? Infinity)) ||
                (c.id === 'eth' && Number(c.value) >= (c.warnAbove ?? Infinity))
            ).length
        ),
        avgHumidity: computed(() => {
            const hum = this.allCards().find(c => c.id === 'hum');
            return hum ? Number(hum.value) : 0;
        }),
        avgTemp: computed(() => {
            const temp = this.allCards().find(c => c.id === 'temp');
            return temp ? Number(temp.value) : 0;
        }),
    };

    cards = computed(() => {
        const cat = this.activeCategory();
        return cat === 'All' ? this.allCards() : this.allCards().filter(c => c.category === cat);
    });

    ngOnInit(): void {
        this.api.getLatest().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: MonitoringReading) => {
                if (!data) { this.loading.set(false); this.noData.set(true); return; }
                this.lastMonitoringDate = data.recordedAt
                    ? new Date(data.recordedAt).toLocaleDateString()
                    : '—';
                this._lastSyncMinutes = data.recordedAt ? this.minutesAgo(data.recordedAt) : 0;
                this.lastSync = data.recordedAt
                    ? this._lastSyncMinutes + ' min ago'
                    : '—';

                this.allCards.set([
                    { id: 'hum',  kind: 'metric',   title: 'Humidity Sensor',    value: String(data.humidity),      unit: '%',   category: 'Environment', trend: [data.humidity] },
                    { id: 'rip',  kind: 'progress',  title: 'Ripeness',           valuePct: data.ripeness,            category: 'Quality',     trend: [data.ripeness] },
                    { id: 'temp', kind: 'metric',    title: 'Temperature',        value: String(data.temperature),   unit: '°C',  category: 'Environment', trend: [data.temperature], warnAbove: 6, critAbove: 8 },
                    { id: 'eth',  kind: 'metric',    title: 'Ethylene Level',     value: String(data.ethyleneLevel), unit: 'ppm', category: 'Quality',     trend: [data.ethyleneLevel], warnAbove: 0.5, critAbove: 1 },
                    { id: 'o2',   kind: 'metric',    title: 'Oxygen',             value: String(data.oxygenLevel),   unit: '%',   category: 'Environment', trend: [data.oxygenLevel] },
                    { id: 'clean',kind: 'metric',    title: 'Cleanliness Levels', value: String(data.cleanliness),   unit: '%',   category: 'Safety',      trend: [data.cleanliness] },
                ]);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.noData.set(true);
            }
        });
    }

    private minutesAgo(dateStr: string): number {
        const diff = Date.now() - new Date(dateStr).getTime();
        return Math.floor(diff / 60000);
    }

    badgeClass(card: MetricCard): 'ok' | 'warn' | 'crit' {
        if (card.value === undefined) return 'ok';
        const v = Number(card.value);
        if (card.critAbove !== undefined && v >= card.critAbove) return 'crit';
        if (card.warnAbove !== undefined && v >= card.warnAbove) return 'warn';
        return 'ok';
    }

    sparkPoints(arr: number[] = [], w = 120, h = 36) {
        if (!arr.length) return '';
        const pad = 2, min = Math.min(...arr), max = Math.max(...arr);
        const x = (i: number) => pad + i * ((w - pad * 2) / (arr.length - 1 || 1));
        const y = (val: number) => h - pad - ((val - min) / (max - min || 1)) * (h - pad * 2);
        return arr.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    }

    setCategory(c: Category | 'All') { this.activeCategory.set(c); }
}
