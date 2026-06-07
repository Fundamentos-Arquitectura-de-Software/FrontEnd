import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AccountStore } from '../../accounts/application/accounts.store';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const store = inject(AccountStore);
    const router = inject(Router);
    const token = store.getToken();

    let authReq = req.clone({ withCredentials: true });

    if (token) {
        authReq = authReq.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Skip 401 handling for login/register/refresh endpoints
            const isAuthEndpoint = req.url.includes('/accounts/login')
                || req.url.includes('/accounts/register')
                || req.url.includes('/accounts/refresh')
                || req.url.includes('/accounts/me')
                || req.url.includes('/billing/plans');

            if (error.status === 401 && !isAuthEndpoint) {
                store.logout();
                router.navigate(['/login']);
            }

            return throwError(() => error);
        })
    );
};
