import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AlertDto {
    id: number;
    severity: string;
    state: string;
    title: string;
    message: string;
    source: string;
    timeAgo: string;
}

const BACKEND_BASE =
    window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://1asi0729-2520-7357-g4-senseeat-backend-freshsens-production.up.railway.app';

@Injectable({ providedIn: 'root' })
export class AlertsApi {
    private readonly baseUrl = `${BACKEND_BASE}/api/alerts`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<AlertDto[]> {
        return this.http.get<AlertDto[]>(this.baseUrl);
    }

    update(id: number, alert: AlertDto): Observable<AlertDto> {
        return this.http.put<AlertDto>(`${this.baseUrl}/${id}`, alert);
    }
}
