import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type ChallengeStatus = 'upcoming' | 'active' | 'finished';
export type GoalType = 'count' | 'percent' | 'streak';

export interface Challenge { id:string; title:string; desc:string; rewardPts:number; startAt:string; endAt:string; goalType:GoalType; goalTarget:number; status:ChallengeStatus; banner?:string; }
export type EnrollmentStatus = 'enrolled' | 'left' | 'completed';
export interface Enrollment { id:string; challengeId:string; userId:string; progress:number; status:EnrollmentStatus; joinedAt:string; leftAt?:string; }
export interface LeaderboardEntry { challengeId:string; userId:string; displayName:string; points:number; rank:number; }

@Injectable({ providedIn: 'root' })
export class ChallengeFacade {
    private readonly userId = 'u-001';
    private _challenges = signal<Challenge[]>([]);
    private _enrollments = signal<Enrollment[]>([]);
    private _leaderboard = signal<LeaderboardEntry[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    constructor(private http: HttpClient) {}

    readonly active = computed(() => this._challenges().filter(c => c.status === 'active'));
    readonly enrolled = computed(() => {
        const ids = new Set(this._enrollments().filter(e => e.status === 'enrolled').map(e => e.challengeId));
        return this._challenges().filter(c => ids.has(c.id));
    });
    readonly progressFor = (id: string) => computed(() => {
        const e = this._enrollments().find(x => x.challengeId === id && x.userId === this.userId && x.status === 'enrolled');
        return e?.progress ?? 0;
    });
    readonly leaderboard = computed(() => this._leaderboard());

    async init() {
        try {
            this.loading.set(true);
            this.error.set(null);
            const data = await firstValueFrom(this.http.get<any>('/db.json'));
            this._challenges.set(data.challenges ?? []);
            const mine = (data.enrollments ?? []).filter((e: Enrollment) => e.userId === this.userId);
            this._enrollments.set(mine);
        } catch {
            this.error.set('Failed to load challenges');
        } finally {
            this.loading.set(false);
        }
    }

    setActiveChallenge(id: string) { this.refreshLeaderboard(id); }

    async enroll(challengeId: string) {
        const already = this._enrollments().some(e => e.challengeId === challengeId && e.status === 'enrolled');
        if (already) return;
        const created: Enrollment = {
            id: crypto.randomUUID(), userId: this.userId, challengeId,
            progress: 0, status: 'enrolled', joinedAt: new Date().toISOString()
        };
        this._enrollments.update(list => [created, ...list]);
    }

    async leave(challengeId: string) {
        this._enrollments.update(list =>
            list.map(e => e.challengeId === challengeId && e.status === 'enrolled'
                ? { ...e, status: 'left', leftAt: new Date().toISOString() }
                : e
            )
        );
        this._leaderboard.set([]);
    }

    async refreshLeaderboard(challengeId: string) {
        this.loading.set(true);
        try {
            const data = await firstValueFrom(this.http.get<any>('/db.json'));
            const lb = (data.leaderboards ?? [])
                .filter((r: LeaderboardEntry) => r.challengeId === challengeId)
                .sort((a: LeaderboardEntry, b: LeaderboardEntry) => a.rank - b.rank);
            this._leaderboard.set(lb);
        } finally {
            this.loading.set(false);
        }
    }
}
