export type EnrollmentStatus = 'enrolled' | 'left' | 'completed';

export interface Enrollment {
    id: string;
    challengeId: string;
    userId: string;
    progress: number;      // 0-100
    status: EnrollmentStatus;
    joinedAt: string;      // ISO
    leftAt?: string;       // ISO
}
