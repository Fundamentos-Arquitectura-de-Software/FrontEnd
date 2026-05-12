import { Injectable, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { MonitoringApi } from '../infrastructure/monitoring-api';
import { MonitoringReading } from '../domain/monitoring-reading.model';

@Injectable({ providedIn: 'root' })
export class MonitoringStore {
  private readonly _latest = signal<MonitoringReading | null>(null);
  private readonly _readings = signal<MonitoringReading[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly latest = this._latest.asReadonly();
  readonly readings = this._readings.asReadonly();

  constructor(private readonly api: MonitoringApi) {}

  async loadLatest(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await lastValueFrom(this.api.getLatest());
      this._latest.set(data);
    } catch {
      this.error.set('Failed to load monitoring data');
    } finally {
      this.loading.set(false);
    }
  }

  async loadAll(): Promise<void> {
    const data = await lastValueFrom(this.api.getAll());
    this._readings.set(data);
  }
}
