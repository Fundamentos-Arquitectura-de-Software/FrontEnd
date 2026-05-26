import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountStore } from '../../accounts/application/accounts.store';

export const authGuard: CanActivateFn = async () => {
    const store = inject(AccountStore);
    const router = inject(Router);

    if (store.isLogged()) {
        return true;
    }

    // Intenta restaurar sesion desde la cookie HttpOnly (caso OAuth2)
    const restored = await store.tryRestoreSession();
    if (restored) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};
