export interface AuthResponse {
    id: number;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'USER' | 'USER_STANDARD' | 'USER_PREMIUM';
    token?: string;
}
