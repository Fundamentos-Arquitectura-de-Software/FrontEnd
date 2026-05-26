import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Achievement } from '../domain/achievement.model';

const opts = { withCredentials: true };

@Injectable({ providedIn: 'root' })
export class AchievementsApi {
    private base = `${environment.apiBaseUrl}/users`;

    constructor(private http: HttpClient) {}

    init(userId: number): Observable<void> {
        return this.http.post<void>(`${this.base}/${userId}/achievements/init`, {}, opts);
    }

    list(userId: number): Observable<Achievement[]> {
        return this.http.get<Achievement[]>(`${this.base}/${userId}/achievements`, opts);
    }

    updateProgress(userId: number, achievementId: string, completionPercentage: number): Observable<Achievement> {
        return this.http.patch<Achievement>(
            `${this.base}/${userId}/achievements/${achievementId}`,
            { completionPercentage },
            opts
        );
    }
}
