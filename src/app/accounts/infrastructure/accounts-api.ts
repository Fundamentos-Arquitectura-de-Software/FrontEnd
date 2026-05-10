import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AccountApiEndpoints } from './account-api-endpoints';
import { User } from '../domain/model/user.entity';
import { Observable } from 'rxjs';
import { AuthResponse } from './account-response';

@Injectable({ providedIn: 'root' })
export class AccountApis {
    constructor(private http: HttpClient) {}

    // Payload que espera el backend (UserRegistrationRequest)
    register(payload: { email: string; password: string; fullName: string }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(AccountApiEndpoints.register, payload);
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(AccountApiEndpoints.login, { email, password });
    }
}
