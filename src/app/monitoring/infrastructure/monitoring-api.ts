import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MonitoringReadingDto {
    id: number;
    temperature: number;
    humidity: number;
    ethyleneLevel: number;
    oxygenLevel: number;
    ripeness: number;
    cleanliness: number;
    recordedAt: string;
}

@Injectable({ providedIn: 'root' })
export class MonitoringApi {
    private base = `${environment.apiBaseUrl}/monitoring`;

    constructor(private http: HttpClient) {}

    getLatest(): Observable<MonitoringReadingDto> {
        return this.http.get<MonitoringReadingDto>(`${this.base}/latest`);
    }

    getAll(): Observable<MonitoringReadingDto[]> {
        return this.http.get<MonitoringReadingDto[]>(this.base);
    }
}
