import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Challenge } from '../domain/challenge';
import { LeaderboardEntry } from '../domain/leaderboard';

export interface LeaderboardEntryDto {
    userId: number;
    challengeId: number;
    progress: number;
    rank: number;
}

@Injectable({ providedIn: 'root' })
export class ChallengeApi {
    private base = `${environment.apiBaseUrl}/challenges`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<Challenge[]> {
        return this.http.get<Challenge[]>(this.base, { withCredentials: true });
    }

    enroll(challengeId: number | string, userId: number): Observable<void> {
        return this.http.post<void>(`${this.base}/${challengeId}/enroll?userId=${userId}`, {}, { withCredentials: true });
    }

    leave(challengeId: number | string, userId: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${challengeId}/enroll?userId=${userId}`, { withCredentials: true });
    }

    getLeaderboard(challengeId: number | string): Observable<LeaderboardEntryDto[]> {
        return this.http.get<LeaderboardEntryDto[]>(`${this.base}/${challengeId}/leaderboard`, { withCredentials: true });
    }
}
