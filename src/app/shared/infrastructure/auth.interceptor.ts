import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AccountStore } from '../../accounts/application/accounts.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const store = inject(AccountStore);
    const token = store.getToken();

    let authReq = req.clone({ withCredentials: true });

    if (token) {
        authReq = authReq.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
        });
    }

    return next(authReq);
};
