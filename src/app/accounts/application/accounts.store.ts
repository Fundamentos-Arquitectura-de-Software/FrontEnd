import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { User } from '../domain/model/user.entity';
import { AccountApis } from '../infrastructure/accounts-api';
import { AuthResponse } from '../infrastructure/account-response';

const CURRENT_USER_KEY = 'currentUser';
const TOKEN_KEY = 'authToken';

@Injectable({ providedIn: 'root' })
export class AccountStore {

    constructor(private readonly api: AccountApis) {}

    async register(user: User): Promise<boolean> {
        try {
            const payload = {
                email: user.email,
                password: user.password,
                fullName: user.name,
            };
            const resp = await lastValueFrom(this.api.register(payload));
            this.saveSession(resp);
            return true;
        } catch (err) {
            console.error('Error al registrar usuario', err);
            return false;
        }
    }

    async login(email: string, password: string): Promise<boolean> {
        try {
            const resp = await lastValueFrom(this.api.login(email, password));
            this.saveSession(resp);
            return true;
        } catch (err) {
            console.error('Error al iniciar sesión', err);
            return false;
        }
    }

    async markAsPaid(email: string): Promise<void> {
        console.warn('[AccountStore] markAsPaid aún no implementado. Email:', email);
    }

    private saveSession(resp: AuthResponse): void {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(resp));
        if (resp.token) {
            localStorage.setItem(TOKEN_KEY, resp.token);
        }
    }

    getCurrentUser(): AuthResponse | null {
        const raw = localStorage.getItem(CURRENT_USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as AuthResponse;
        } catch {
            return null;
        }
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    logout(): void {
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
    }

    isLogged(): boolean {
        return !!this.getToken();
    }
}
