import { Injectable, signal, computed } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { AlertsApi } from '../infrastructure/alerts-api';
import { Alert } from '../domain/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertsStore {
  private readonly _alerts = signal<Alert[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly alerts = this._alerts.asReadonly();
  readonly active = computed(() => this._alerts().filter(a => a.state === 'active'));
  readonly critical = computed(() => this._alerts().filter(a => a.severity === 'critical'));

  constructor(private readonly api: AlertsApi) {}

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await lastValueFrom(this.api.getAll());
      this._alerts.set(data);
    } catch {
      this.error.set('Failed to load alerts');
    } finally {
      this.loading.set(false);
    }
  }

  async update(id: number, alert: Alert): Promise<void> {
    const updated = await lastValueFrom(this.api.update(id, alert));
    this._alerts.update(list => list.map(a => a.id === updated.id ? updated : a));
  }
}
