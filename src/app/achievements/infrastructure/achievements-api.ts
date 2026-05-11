import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AchievementDto {
    id: string;
    userId: number;
    name: string;
    completionPercentage: number;
    isDefault: boolean;
}

@Injectable({ providedIn: 'root' })
export class AchievementsApi {
    private base = `${environment.apiBaseUrl}/users`;

    constructor(private http: HttpClient) {}

    init(userId: number): Observable<void> {
        return this.http.post<void>(`${this.base}/${userId}/achievements/init`, {});
    }

    list(userId: number): Observable<AchievementDto[]> {
        return this.http.get<AchievementDto[]>(`${this.base}/${userId}/achievements`);
    }

    updateProgress(userId: number, achievementId: string, completionPercentage: number): Observable<AchievementDto> {
        return this.http.patch<AchievementDto>(
            `${this.base}/${userId}/achievements/${achievementId}`,
            { completionPercentage }
        );
    }
}
