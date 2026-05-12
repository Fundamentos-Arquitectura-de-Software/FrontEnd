export type AchievementStatus = 'completed' | 'in-progress' | 'pending';

export interface Achievement {
    id: string;
    userId: number;
    name: string;
    completionPercentage: number;
    isDefault: boolean;
}
