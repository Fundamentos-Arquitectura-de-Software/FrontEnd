import { Injectable, computed, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Challenge } from '../domain/challenge';
import { LeaderboardEntry } from '../domain/leaderboard';
import { ChallengeApi } from '../infrastructure/challenge.api';
import { AccountStore } from '../../accounts/application/accounts.store';

export type { ChallengeStatus, GoalType } from '../domain/challenge';

export interface Enrollment {
    id: string;
    challengeId: string;
    userId: string;
    progress: number;
    status: 'enrolled' | 'left' | 'completed';
    joinedAt: string;
    leftAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ChallengeFacade {
    private readonly api = inject(ChallengeApi);
    private readonly accountStore = inject(AccountStore);

    private _challenges = signal<Challenge[]>([]);
    private _enrolledIds = signal<Set<string>>(new Set());
    private _leaderboard = signal<LeaderboardEntry[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    readonly active = computed(() => this._challenges().filter(c => c.status === 'active'));
    readonly enrolled = computed(() =>
        this._challenges().filter(c => this._enrolledIds().has(String(c.id)))
    );
    readonly progressFor = (id: string) => computed(() => {
        const user = this.accountStore.getCurrentUser();
        if (!user) return 0;
        const entry = this._leaderboard().find(
            e => e.challengeId === id && e.userId === String(user.id)
        );
        return entry?.points ?? 0;
    });
    readonly leaderboard = computed(() => this._leaderboard());

    async init() {
        try {
            this.loading.set(true);
            this.error.set(null);
            const challenges = await firstValueFrom(this.api.getAll());
            this._challenges.set(challenges.map(c => ({
                ...c,
                id: String(c.id),
                desc: (c as any).description ?? '',
                banner: (c as any).bannerUrl,
            })));
        } catch {
            this.error.set('Failed to load challenges');
        } finally {
            this.loading.set(false);
        }
    }

    async enroll(challengeId: string) {
        const user = this.accountStore.getCurrentUser();
        if (!user) return;
        try {
            await firstValueFrom(this.api.enroll(challengeId, user.id));
            this._enrolledIds.update(s => new Set([...s, challengeId]));
        } catch {
            this.error.set('No se pudo inscribir en el desafío');
        }
    }

    async leave(challengeId: string) {
        const user = this.accountStore.getCurrentUser();
        if (!user) return;
        try {
            await firstValueFrom(this.api.leave(challengeId, user.id));
            this._enrolledIds.update(s => {
                const next = new Set(s);
                next.delete(challengeId);
                return next;
            });
            this._leaderboard.set([]);
        } catch {
            this.error.set('No se pudo salir del desafío');
        }
    }

    setActiveChallenge(id: string) { this.refreshLeaderboard(id); }

    async refreshLeaderboard(challengeId: string) {
        this.loading.set(true);
        try {
            const entries = await firstValueFrom(this.api.getLeaderboard(challengeId));
            this._leaderboard.set(entries.map(e => ({
                challengeId: String(e.challengeId),
                userId: String(e.userId),
                displayName: `User ${e.userId}`,
                points: e.progress,
                rank: e.rank,
            })));
        } catch {
            this._leaderboard.set([]);
        } finally {
            this.loading.set(false);
        }
    }
}
