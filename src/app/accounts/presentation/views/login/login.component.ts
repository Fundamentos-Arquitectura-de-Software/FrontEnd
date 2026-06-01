import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccountStore } from '../../../application/accounts.store';
import { environment } from '../../../../../environments/environment';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'fs-login',
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        TranslateModule,
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginView {
    loginData = {
        email: '',
        password: '',
    };

    isSubmitting = false;
    loginError: string | null = null;

    readonly oauthGoogleUrl = environment.apiBaseUrl.replace('/api', '') + '/oauth2/authorization/google';

    constructor(
        private readonly accountStore: AccountStore,
        private readonly router: Router
    ) {}

    async onSubmit(): Promise<void> {
        if (this.isSubmitting) return;

        if (!this.loginData.email || !this.loginData.password) {
            this.loginError = 'auth.login.errors.required';
            return;
        }

        this.isSubmitting = true;
        this.loginError = null;

        const success = await this.accountStore.login(
            this.loginData.email,
            this.loginData.password
        );

        this.isSubmitting = false;

        if (success) {
            this.router.navigate(['/dashboard']);
        } else {
            this.loginError = 'auth.login.errors.invalid';
        }
    }

    goToRegister(): void {
        this.router.navigate(['/register']);
    }
}
