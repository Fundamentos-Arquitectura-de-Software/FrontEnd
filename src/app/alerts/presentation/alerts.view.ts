import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AlertsApi, AlertDto } from '../infrastructure/alerts-api';

type Severity = 'critical' | 'warning' | 'info';
type State = 'active' | 'muted' | 'resolved';

interface AlertCard {
    id: string;
    severity: Severity;
    state: State;
    title: string;
    message: string;
    source: 'Temp' | 'Humidity' | 'Ethylene' | 'Cleanliness' | 'Oxygen';
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

    // Todas las alertas (mock + api)
    private _all = signal<AlertCard[]>([]);

    // Tabs
    tabs = [
        { key:'active' as State,   label:'Active' },
        { key:'muted' as State,    label:'Muted' },
        { key:'resolved' as State, label:'Resolved' },
        { key:'all' as const,      label:'All' },
    ];

    activeTab = signal<State | 'all'>('active');
    query = signal('');
    sevFilter = signal<Severity | 'all'>('all');

    // Modal
    openId = signal<string | null>(null);

    ngOnInit(): void {
        this.loadMockAlerts();
        this.loadApiAlerts();
    }

    /**
     * LOAD MOCK ALERTS (optional)
     */
    private loadMockAlerts() {
        const mock: AlertCard[] = [
            { id:'1', severity:'warning',  state:'active',   title:'High ethylene level', message:'Ethylene exceeded 0.5ppm', source:'Ethylene', timeAgo:'2m ago' },
            { id:'2', severity:'info',     state:'active',   title:'High temperature',    message:'Temperature above 6° C',  source:'Temp',     timeAgo:'2m ago' },
            { id:'3', severity:'critical', state:'muted',    title:'Critical temperature',message:'Freezer above 10° C',    source:'Temp',     timeAgo:'1h ago' },
            { id:'4', severity:'warning',  state:'resolved', title:'Cleanliness low',     message:'Below 80% threshold',     source:'Cleanliness', timeAgo:'Yesterday' },
        ];
        this._all.set(mock);
    }

    /**
     * LOAD API ALERTS
     */
    private loadApiAlerts() {
        this.api.getAll().subscribe((data: AlertDto[]) => {
            const converted = data.map(this.fromDto);
            this._all.set([...this._all(), ...converted]); // merge mock + API
        });
    }

    /**
     * Converter: DTO → UI model
     */
    private fromDto(dto: AlertDto): AlertCard {
        return {
            id: String(dto.id),
            severity: dto.severity as Severity,
            state: dto.state as State,
            title: dto.title,
            message: dto.message,
            source: dto.source as any,
            timeAgo: dto.timeAgo
        };
    }

    /**
     * Converter: UI → DTO (for PUT update)
     */
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

    /**
     * Visible alerts (filters)
     */
    visible = computed(() => {
        const q = this.query().toLowerCase();
        const tab = this.activeTab();
        const sev = this.sevFilter();

        return this._all().filter(a => {
            const okTab = tab === 'all' ? true : a.state === tab;
            const okSev = sev === 'all' ? true : a.severity === sev;
            const okQ = !q || a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q);
            return okTab && okSev && okQ;
        });
    });

    /**
     * Resolve alert (UI + API)
     */
    resolve(a: AlertCard) {
        a.state = 'resolved';
        this._all.set([...this._all()]);
        this.api.update(Number(a.id), this.toDto(a)).subscribe();
    }

    /**
     * Mute alert (UI + API)
     */
    mute(a: AlertCard) {
        a.state = 'muted';
        this._all.set([...this._all()]);
        this.api.update(Number(a.id), this.toDto(a)).subscribe();
    }

    /**
     * Modal controls
     */
    open(a: AlertCard) { this.openId.set(a.id); }
    close() { this.openId.set(null); }
    isOpen(a: AlertCard) { return this.openId() === a.id; }
}
