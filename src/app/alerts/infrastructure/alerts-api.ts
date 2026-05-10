import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AlertDto {
    id: number;
    severity: string;
    state: string;
    title: string;
    message: string;
    source: string;
    timeAgo: string;
}

@Injectable({ providedIn: 'root' })
export class AlertsApi {
    private readonly baseUrl = `${environment.apiBaseUrl}/alerts`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<AlertDto[]> {
        return this.http.get<AlertDto[]>(this.baseUrl);
    }

    update(id: number, alert: AlertDto): Observable<AlertDto> {
        return this.http.put<AlertDto>(`${this.baseUrl}/${id}`, alert);
    }
}
