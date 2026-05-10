export type ChallengeStatus = 'upcoming' | 'active' | 'finished';
export type GoalType = 'count' | 'percent' | 'streak';

export interface Challenge {
    id: string;
    title: string;
    desc: string;
    rewardPts: number;
    startAt: string; // ISO
    endAt: string;   // ISO
    goalType: GoalType;
    goalTarget: number;   // p.ej. 7 días, 5 acciones, 10%
    status: ChallengeStatus;
    banner?: string;
}
