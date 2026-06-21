import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AccountStore } from '../../accounts/application/accounts.store';
import { catchError, from, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const store = inject(AccountStore);
    const router = inject(Router);

    // El token viaja en la cookie HttpOnly; solo hace falta withCredentials.
    const authReq = req.clone({ withCredentials: true });

    const isAuthEndpoint =
        req.url.includes('/accounts/login') ||
        req.url.includes('/accounts/register') ||
        req.url.includes('/accounts/refresh') ||
        req.url.includes('/accounts/me') ||
        req.url.includes('/billing/plans');

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !isAuthEndpoint) {
                // Intenta renovar el access token (15 min) con el refresh token (7 días) antes de desloguear.
                return from(store.refreshToken()).pipe(
                    switchMap((renewed) => {
                        if (renewed) {
                            return next(req.clone({ withCredentials: true }));
                        }
                        store.logout();
                        router.navigate(['/login']);
                        return throwError(() => error);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
