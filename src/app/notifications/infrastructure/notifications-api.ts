import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../domain/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
    private readonly http = inject(HttpClient);
    private readonly base = environment.apiBaseUrl;

    getInbox(): Observable<Notification[]> {
        return this.http.get<Notification[]>(`${this.base}/notifications`, { withCredentials: true });
    }

    markAsRead(id: number): Observable<void> {
        return this.http.patch<void>(`${this.base}/notifications/${id}/read`, {}, { withCredentials: true });
    }
}
