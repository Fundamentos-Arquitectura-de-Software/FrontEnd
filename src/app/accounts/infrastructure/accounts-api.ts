import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AccountApiEndpoints } from './account-api-endpoints';
import { Observable } from 'rxjs';
import { AuthResponse } from './account-response';

@Injectable({ providedIn: 'root' })
export class AccountApis {
    constructor(private http: HttpClient) {}

    register(payload: { email: string; password: string; fullName: string }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(AccountApiEndpoints.register, payload, { withCredentials: true });
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(AccountApiEndpoints.login, { email, password }, { withCredentials: true });
    }

    logout(): Observable<void> {
        return this.http.post<void>(AccountApiEndpoints.logout, {}, { withCredentials: true });
    }

    getMe(): Observable<AuthResponse> {
        return this.http.get<AuthResponse>(AccountApiEndpoints.me, { withCredentials: true });
    }

    refresh(): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(AccountApiEndpoints.refresh, {}, { withCredentials: true });
    }
}
