import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MonitoringReading } from '../domain/monitoring-reading.model';

@Injectable({ providedIn: 'root' })
export class MonitoringApi {
    private base = `${environment.apiBaseUrl}/monitoring`;

    constructor(private http: HttpClient) {}

    getLatest(): Observable<MonitoringReading> {
        return this.http.get<MonitoringReading>(`${this.base}/latest`);
    }

    getAll(): Observable<MonitoringReading[]> {
        return this.http.get<MonitoringReading[]>(this.base);
    }
}
