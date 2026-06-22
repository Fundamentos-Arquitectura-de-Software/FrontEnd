import { Component, computed, signal, inject, OnInit, DestroyRef } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AlertsApi } from '../infrastructure/alerts-api';
import { Alert as AlertDto, AlertSeverity, AlertState } from '../domain/alert.model';

type Severity = AlertSeverity;
type State = AlertState;

interface AlertCard {
    id: string;
    severity: Severity;
    state: State;
    title: string;
    message: string;
    source: string;
    timeAgo: string;
}

@Component({
    selector: 'fs-alerts-view',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, FormsModule, TranslateModule],
    templateUrl: './alerts.view.html',
    styleUrls: ['./alerts.view.css'],
})
export class AlertsView implements OnInit {

    private api = inject(AlertsApi);
    private destroyRef = inject(DestroyRef);

    private _all = signal<AlertCard[]>([]);
    loading = signal(true);

    // Filters (all dropdown-driven)
    stateFilter = signal<State | 'all'>('active');
    sevFilter = signal<Severity | 'all'>('all');
    query = signal('');

    // Detail modal
    openId = signal<string | null>(null);

    ngOnInit(): void {
        this.loadMockAlerts();
        this.loadApiAlerts();
    }

    private loadMockAlerts() {
        const mock: AlertCard[] = [
            { id: '1', severity: 'info',     state: 'active',   title: 'High temperature',     message: 'Temperature above 6 °C',     source: 'Temperature', timeAgo: '2m ago' },
            { id: '2', severity: 'warning',  state: 'active',   title: 'Humidity out of range', message: 'Humidity above 80%',        source: 'Humidity',    timeAgo: '8m ago' },
            { id: '3', severity: 'critical', state: 'muted',    title: 'Critical temperature',  message: 'Freezer above 10 °C',        source: 'Temperature', timeAgo: '1h ago' },
            { id: '4', severity: 'warning',  state: 'resolved', title: 'Low humidity',          message: 'Humidity below 50%',         source: 'Humidity',    timeAgo: 'Yesterday' },
        ];
        this._all.set(mock);
    }

    private loadApiAlerts() {
        this.api.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: AlertDto[]) => {
                const converted = data.map(this.fromDto);
                this._all.set([...this._all(), ...converted]);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    private fromDto(dto: AlertDto): AlertCard {
        return {
            id: String(dto.id),
            severity: dto.severity as Severity,
            state: dto.state as State,
            title: dto.title,
            message: dto.message,
            source: dto.source,
            timeAgo: dto.timeAgo
        };
    }

    private toDto(a: AlertCard): AlertDto {
        return {
            id: Number(a.id),
            severity: a.severity,
            state: a.state,
            title: a.title,
            message: a.message,
            source: a.source,
            timeAgo: a.timeAgo
        };
    }

    visible = computed(() => {
        const q = this.query().toLowerCase();
        const state = this.stateFilter();
        const sev = this.sevFilter();

        return this._all().filter(a => {
            const okState = state === 'all' ? true : a.state === state;
            const okSev = sev === 'all' ? true : a.severity === sev;
            const okQ = !q || a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q);
            return okState && okSev && okQ;
        });
    });

    resolve(a: AlertCard) {
        a.state = 'resolved';
        this._all.set([...this._all()]);
        this.api.update(Number(a.id), this.toDto(a)).subscribe();
    }

    mute(a: AlertCard) {
        a.state = 'muted';
        this._all.set([...this._all()]);
        this.api.update(Number(a.id), this.toDto(a)).subscribe();
    }

    open(a: AlertCard) { this.openId.set(a.id); }
    close() { this.openId.set(null); }
    isOpen(a: AlertCard) { return this.openId() === a.id; }

    readonly skeletons = [0, 1, 2];
}
