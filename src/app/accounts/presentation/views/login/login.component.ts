import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccountStore } from '../../../application/accounts.store';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        TranslateModule,
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent {
    loginData = {
        email: '',
        password: '',
    };

    isSubmitting = false;
    loginError: string | null = null;

    constructor(
        private readonly accountStore: AccountStore,
        private readonly router: Router
    ) {}

    async onSubmit(): Promise<void> {
        if (this.isSubmitting) return;

        if (!this.loginData.email || !this.loginData.password) {
            this.loginError = 'Por favor completa todos los campos.';
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
            // ajusta la ruta si quieres ir a otra página
            this.router.navigate(['/dashboard']);
        } else {
            this.loginError = 'Correo o contraseña incorrectos o usuario no ha pagado ';
        }
    }

    goToRegister(): void {
        this.router.navigate(['/register']);
    }
}
