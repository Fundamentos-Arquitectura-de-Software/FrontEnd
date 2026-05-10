import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountStore } from '../../accounts/application/accounts.store';

export const authGuard: CanActivateFn = () => {
    const store = inject(AccountStore);
    const router = inject(Router);

    if (store.isLogged()) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};
