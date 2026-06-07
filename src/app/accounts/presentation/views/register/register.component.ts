import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccountStore } from '../../../application/accounts.store';
import { User } from '../../../domain/model/user.entity';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/application/toast.service';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'fs-register',
    standalone: true,
    imports: [FormsModule, CommonModule, TranslateModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterView {
    user: User = { name: '', email: '', password: '' };
    confirmPassword = '';
    isSubmitting = false;

    readonly oauthGoogleUrl = environment.apiBaseUrl.replace('/api', '') + '/oauth2/authorization/google';

    constructor(
        private accountStore: AccountStore,
        private router: Router,
        private toast: ToastService,
        private translate: TranslateService
    ) {}

    goToLogin() { this.router.navigate(['/login']); }

    async onSubmit() {
        if (this.isSubmitting) return;
        if (!this.user.name || !this.user.email || !this.user.password || !this.confirmPassword) {
            this.toast.error(this.translate.instant('auth.register.errors.required'));
            return;
        }
        if (this.user.password !== this.confirmPassword) {
            this.toast.error(this.translate.instant('auth.register.errors.passwordMismatch'));
            return;
        }
        if (this.user.password.length < 8) {
            this.toast.error(this.translate.instant('auth.register.errors.passwordTooShort'));
            return;
        }
        if (!/[A-Z]/.test(this.user.password) || !/\d/.test(this.user.password)) {
            this.toast.error(this.translate.instant('auth.register.errors.passwordWeak'));
            return;
        }

        this.isSubmitting = true;
        const result = await this.accountStore.register(this.user);
        this.isSubmitting = false;

        if (result.ok) {
            this.toast.success(this.translate.instant('auth.register.errors.success'));
            this.router.navigate(['/plan']);
        } else {
            this.toast.error(result.message ?? this.translate.instant('auth.register.errors.emailTaken'));
        }
    }
}
