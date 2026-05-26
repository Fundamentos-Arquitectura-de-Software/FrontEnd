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

    async register(user: User): Promise<{ ok: boolean; message?: string }> {
        try {
            const payload = { email: user.email, password: user.password, fullName: user.name };
            const resp = await lastValueFrom(this.api.register(payload));
            this.saveSession(resp);
            return { ok: true };
        } catch (err: any) {
            const body = err?.error;
            const message: string | undefined =
                body?.errors?.[0]?.defaultMessage ??
                body?.message ??
                undefined;
            return { ok: false, message };
        }
    }

    async login(email: string, password: string): Promise<boolean> {
        try {
            const resp = await lastValueFrom(this.api.login(email, password));
            this.saveSession(resp);
            return true;
        } catch {
            return false;
        }
    }

    async markAsPaid(email: string): Promise<void> {
        console.warn('[AccountStore] markAsPaid not implemented. Email:', email);
    }

    private saveSession(resp: AuthResponse): void {
        const { token, ...userInfo } = resp;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userInfo));
        if (token) localStorage.setItem(TOKEN_KEY, token);
    }

    getCurrentUser(): Omit<AuthResponse, 'token'> | null {
        const raw = localStorage.getItem(CURRENT_USER_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw) as Omit<AuthResponse, 'token'>; }
        catch { return null; }
    }

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    logout(): void {
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        this.api.logout().subscribe({ error: () => {} });
    }

    isLogged(): boolean {
        return !!this.getCurrentUser();
    }

    /**
     * Intenta restaurar la sesion llamando a GET /me con la cookie HttpOnly.
     * Usado por el authGuard despues de un login OAuth2 donde localStorage esta vacio.
     * Retorna true si la sesion fue restaurada, false si no hay sesion activa.
     */
    async tryRestoreSession(): Promise<boolean> {
        try {
            const resp = await lastValueFrom(this.api.getMe());
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(resp));
            return true;
        } catch {
            return false;
        }
    }
}
