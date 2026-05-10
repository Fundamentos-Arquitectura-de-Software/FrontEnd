import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AccountStore } from '../../accounts/application/accounts.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const store = inject(AccountStore);
    const token = store.getToken();

    if (token) {
        const authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
        });
        return next(authReq);
    }

    return next(req);
};
