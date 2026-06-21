import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Achievement } from '../domain/achievement.model';

const opts = { withCredentials: true };

@Injectable({ providedIn: 'root' })
export class AchievementsApi {
    // El backend resuelve el usuario desde el token (ya no se envía el userId en la URL).
    private base = `${environment.apiBaseUrl}/achievements`;

    constructor(private http: HttpClient) {}

    init(): Observable<void> {
        return this.http.post<void>(`${this.base}/init`, {}, opts);
    }

    list(): Observable<Achievement[]> {
        return this.http.get<Achievement[]>(this.base, opts);
    }

    updateProgress(achievementId: string, completionPercentage: number): Observable<Achievement> {
        return this.http.patch<Achievement>(
            `${this.base}/${achievementId}`,
            { completionPercentage },
            opts
        );
    }
}
