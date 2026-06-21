import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { User } from '../domain/model/user.entity';
import { AccountApis } from '../infrastructure/accounts-api';
import { AuthResponse } from '../infrastructure/account-response';

const CURRENT_USER_KEY = 'currentUser';

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
        // El token NO se guarda en localStorage: viaja solo en la cookie HttpOnly (seguro ante XSS).
        const userInfo = {
            id: resp.id,
            email: resp.email,
            fullName: resp.fullName,
            role: resp.role,
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userInfo));
    }

    getCurrentUser(): Omit<AuthResponse, 'token'> | null {
        const raw = localStorage.getItem(CURRENT_USER_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw) as Omit<AuthResponse, 'token'>; }
        catch { return null; }
    }

    logout(): void {
        localStorage.removeItem(CURRENT_USER_KEY);
        this.api.logout().subscribe({ error: () => {} });
    }

    isLogged(): boolean {
        return !!this.getCurrentUser();
    }

    /**
     * Renueva el access token usando el refreshToken (cookie). Devuelve true si se renovó.
     * Usado por el interceptor ante un 401 antes de desloguear.
     */
    async refreshToken(): Promise<boolean> {
        try {
            const resp = await lastValueFrom(this.api.refresh());
            this.saveSession(resp);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Refresca la sesión tras un cambio de rol (ej. upgrade a premium): pide un token nuevo
     * con el rol actualizado y actualiza el usuario guardado. Necesario para que @PreAuthorize premium aplique.
     */
    async refreshAfterRoleChange(): Promise<void> {
        await this.refreshToken();
        try {
            const me = await lastValueFrom(this.api.getMe());
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(me));
        } catch { /* ignore */ }
    }

    getRole(): string | null {
        return this.getCurrentUser()?.role ?? null;
    }

    isPremium(): boolean {
        const role = this.getRole();
        return role === 'USER_PREMIUM' || role === 'ADMIN';
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
