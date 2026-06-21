import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../domain/notification.model';

export interface NotificationPreference {
    userId?: number;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    quietStart?: string | null;
    quietEnd?: string | null;
}

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

    getPreferences(): Observable<NotificationPreference> {
        return this.http.get<NotificationPreference>(`${this.base}/notifications/preferences`, { withCredentials: true });
    }

    updatePreferences(prefs: NotificationPreference): Observable<NotificationPreference> {
        return this.http.put<NotificationPreference>(`${this.base}/notifications/preferences`, prefs, { withCredentials: true });
    }
}
