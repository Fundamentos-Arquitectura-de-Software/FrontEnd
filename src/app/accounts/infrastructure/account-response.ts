export interface AuthResponse {
    id: number;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'USER';
    token: string;
}
