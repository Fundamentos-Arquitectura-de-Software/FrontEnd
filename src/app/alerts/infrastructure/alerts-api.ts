import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alert } from '../domain/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertsApi {
    private readonly baseUrl = `${environment.apiBaseUrl}/alerts`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<Alert[]> {
        return this.http.get<Alert[]>(this.baseUrl);
    }

    update(id: number, alert: Alert): Observable<Alert> {
        return this.http.put<Alert>(`${this.baseUrl}/${id}`, alert);
    }
}
