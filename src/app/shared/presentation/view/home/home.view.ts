import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AccountStore } from '../../../../accounts/application/accounts.store';
import { InventoryApi } from '../../../../inventory/infrastructure/inventory-api';
import { AlertsApi } from '../../../../alerts/infrastructure/alerts-api';
import { MonitoringApi } from '../../../../monitoring/infrastructure/monitoring-api';
import { Alert } from '../../../../alerts/domain/alert.model';
import { MonitoringReading } from '../../../../monitoring/domain/monitoring-reading.model';

type SensorStatus = 'ok' | 'warn' | 'crit' | 'off';

@Component({
    selector: 'fs-home-view',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, RouterLink, TranslateModule],
    templateUrl: './home.view.html',
    styleUrl: './home.view.css',
})
export class HomeView implements OnInit {
    private readonly accountStore = inject(AccountStore);
    private readonly inventoryApi = inject(InventoryApi);
    private readonly alertsApi = inject(AlertsApi);
    private readonly monitoringApi = inject(MonitoringApi);
    private readonly destroyRef = inject(DestroyRef);

    name = '';
    today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    totalProducts = signal(0);
    freshnessScore = signal(0);

    private _alerts = signal<Alert[]>([]);
    activeAlerts = computed(() => this._alerts().filter(a => a.state === 'active'));
    criticalCount = computed(() => this.activeAlerts().filter(a => a.severity === 'critical').length);
    warningCount = computed(() => this.activeAlerts().filter(a => a.severity === 'warning').length);
    recentAlerts = computed(() => this.activeAlerts().slice(0, 4));

    sensorData = signal<MonitoringReading | null>(null);

    tempStatus = computed(() => this.classifyLinear(this.sensorData()?.temperature ?? null, 6, 10));
    humidityStatus = computed(() => this.classifyHumidity(this.sensorData()?.humidity ?? null));
    ethyleneStatus = computed(() => this.classifyLinear(this.sensorData()?.ethyleneLevel ?? null, 0.5, 1.0));
    cleanliness = computed(() => this.sensorData()?.cleanliness ?? null);
    cleanlinessStatus = computed(() => this.classifyInverse(this.cleanliness(), 80, 60));

    ngOnInit(): void {
        const user = this.accountStore.getCurrentUser();
        this.name = user?.fullName ?? 'Guest';
        this.loadInventory();
        this.loadAlerts();
        this.loadMonitoring();
    }

    private loadInventory(): void {
        this.inventoryApi
            .getProducts()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: products => {
                    this.totalProducts.set(products.length);
                    const avg = products.length
                        ? products.reduce((s, p) => s + (p.quantity ?? 0), 0) / products.length
                        : 0;
                    this.freshnessScore.set(Math.min(Math.round((avg / 10) * 100), 100));
                },
                error: () => {},
            });
    }

    private loadAlerts(): void {
        this.alertsApi
            .getAll()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: a => this._alerts.set(a), error: () => {} });
    }

    private loadMonitoring(): void {
        this.monitoringApi
            .getLatest()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: d => this.sensorData.set(d), error: () => {} });
    }

    private classifyLinear(val: number | null, warn: number, crit: number): SensorStatus {
        if (val === null) return 'off';
        if (val >= crit) return 'crit';
        if (val >= warn) return 'warn';
        return 'ok';
    }

    private classifyHumidity(val: number | null): SensorStatus {
        if (val === null) return 'off';
        if (val > 90 || val < 50) return 'crit';
        if (val > 80 || val < 60) return 'warn';
        return 'ok';
    }

    private classifyInverse(val: number | null, warn: number, crit: number): SensorStatus {
        if (val === null) return 'off';
        if (val <= crit) return 'crit';
        if (val <= warn) return 'warn';
        return 'ok';
    }

    scoreVerdict(): string {
        if (this.totalProducts() === 0) return 'home.scoreVerdict.empty';
        const s = this.freshnessScore();
        if (s >= 70) return 'home.scoreVerdict.good';
        if (s >= 40) return 'home.scoreVerdict.attention';
        return 'home.scoreVerdict.review';
    }

    fmt(val: number | null, decimals = 1): string {
        if (val === null) return '—';
        return val.toFixed(decimals);
    }
}
