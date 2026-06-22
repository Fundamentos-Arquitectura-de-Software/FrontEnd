import { Component, OnInit, computed, signal, inject, DestroyRef } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MonitoringApi } from '../infrastructure/monitoring-api';
import { MonitoringReading } from '../domain/monitoring-reading.model';

type Status = 'ok' | 'warn' | 'crit';

interface MetricCard {
    id: 'temp' | 'hum';
    icon: string;
    title: string;
    value: number;
    unit: string;
    status: Status;
    rangeLabel: string;
    trend: number[];
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

    lastReadingDate = '—';
    private _lastSyncMinutes = 0;
    get lastSyncMinutes() { return this._lastSyncMinutes; }

    loading = signal(true);
    noData = signal(false);

    private cards = signal<MetricCard[]>([]);
    metrics = computed(() => this.cards());

    avgTemp = computed(() => this.cards().find(c => c.id === 'temp')?.value ?? 0);
    avgHumidity = computed(() => this.cards().find(c => c.id === 'hum')?.value ?? 0);

    overallStatus = computed<Status>(() => {
        const statuses = this.cards().map(c => c.status);
        if (statuses.includes('crit')) return 'crit';
        if (statuses.includes('warn')) return 'warn';
        return 'ok';
    });

    // Skeleton placeholders
    readonly skeletons = [0, 1];

    ngOnInit(): void {
        this.api.getLatest().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: MonitoringReading) => {
                if (!data) { this.loading.set(false); this.noData.set(true); return; }

                this._lastSyncMinutes = data.recordedAt ? this.minutesAgo(data.recordedAt) : 0;
                this.lastReadingDate = data.recordedAt
                    ? new Date(data.recordedAt).toLocaleString()
                    : '—';

                this.cards.set([
                    {
                        id: 'temp',
                        icon: 'thermostat',
                        title: 'Temperature',
                        value: data.temperature,
                        unit: '°C',
                        status: this.classifyTemp(data.temperature),
                        rangeLabel: '0 – 6 °C',
                        trend: [data.temperature],
                    },
                    {
                        id: 'hum',
                        icon: 'humidity_percentage',
                        title: 'Humidity',
                        value: data.humidity,
                        unit: '%',
                        status: this.classifyHumidity(data.humidity),
                        rangeLabel: '60 – 80 %',
                        trend: [data.humidity],
                    },
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
        return Math.max(Math.floor(diff / 60000), 0);
    }

    private classifyTemp(v: number): Status {
        if (v >= 8) return 'crit';
        if (v >= 6) return 'warn';
        return 'ok';
    }

    private classifyHumidity(v: number): Status {
        if (v > 90 || v < 50) return 'crit';
        if (v > 80 || v < 60) return 'warn';
        return 'ok';
    }

    sparkPoints(arr: number[] = [], w = 200, h = 48) {
        if (!arr.length) return '';
        const pad = 4, min = Math.min(...arr), max = Math.max(...arr);
        const x = (i: number) => pad + i * ((w - pad * 2) / (arr.length - 1 || 1));
        const y = (val: number) => h - pad - ((val - min) / (max - min || 1)) * (h - pad * 2);
        return arr.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    }
}
