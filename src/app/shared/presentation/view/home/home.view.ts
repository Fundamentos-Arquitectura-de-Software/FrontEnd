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

    loading = signal(true);
    totalProducts = signal(0);
    freshnessScore = signal(0);

    private _alerts = signal<Alert[]>([]);
    // Comparación case-insensitive: el backend usa ACTIVE/WARNING/CRITICAL (mayúsculas).
    activeAlerts = computed(() => this._alerts().filter(a => (a.state ?? '').toLowerCase() === 'active'));
    criticalCount = computed(() => this.activeAlerts().filter(a => (a.severity ?? '').toLowerCase() === 'critical').length);
    warningCount = computed(() => this.activeAlerts().filter(a => (a.severity ?? '').toLowerCase() === 'warning').length);
    recentAlerts = computed(() => this.activeAlerts().slice(0, 4));

    sensorData = signal<MonitoringReading | null>(null);

    tempStatus = computed(() => this.classifyLinear(this.sensorData()?.temperature ?? null, 6, 8));
    humidityStatus = computed(() => this.classifyHumidity(this.sensorData()?.humidity ?? null));

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
                // El freshnessScore lo deriva recomputeFreshness() desde los sensores.
                next: products => {
                    this.totalProducts.set(products.length);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
            });
    }

    /**
     * Puntaje de frescura (0–100) derivado del estado real de los sensores:
     * cada métrica aporta ok=100, warn=60, crit=20. Promedio de las métricas disponibles.
     */
    private recomputeFreshness(): void {
        const statuses = [
            this.tempStatus(), this.humidityStatus(), this.ethyleneStatus(), this.cleanlinessStatus(),
        ].filter(s => s !== 'off');
        if (statuses.length === 0) {
            this.freshnessScore.set(0);
            return;
        }
        const score = (s: SensorStatus) => (s === 'ok' ? 100 : s === 'warn' ? 60 : 20);
        const avg = statuses.reduce((sum, s) => sum + score(s), 0) / statuses.length;
        this.freshnessScore.set(Math.round(avg));
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
            .subscribe({
                next: d => { this.sensorData.set(d); this.recomputeFreshness(); },
                error: () => {},
            });
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
