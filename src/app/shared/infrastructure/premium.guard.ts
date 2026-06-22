import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountStore } from '../../accounts/application/accounts.store';

/**
 * Permite el acceso solo a usuarios premium (USER_PREMIUM / ADMIN).
 * Si no lo son, redirige a la pantalla de planes para que puedan suscribirse.
 */
export const premiumGuard: CanActivateFn = () => {
    const store = inject(AccountStore);
    const router = inject(Router);

    if (store.isPremium()) {
        return true;
    }
    router.navigate(['/plan']);
    return false;
};
