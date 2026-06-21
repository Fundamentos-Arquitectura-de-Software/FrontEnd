export interface AuthResponse {
    id: number;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'USER_STANDARD' | 'USER_PREMIUM';
    token?: string;
    refreshToken?: string;
}
