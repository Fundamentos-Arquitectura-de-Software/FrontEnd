import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccountStore } from '../../../application/accounts.store';
import { User } from '../../../domain/model/user.entity';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../../shared/application/toast.service';

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

    constructor(
        private accountStore: AccountStore,
        private router: Router,
        private toast: ToastService
    ) {}

    goToLogin() { this.router.navigate(['/login']); }

    async onSubmit() {
        if (!this.user.name || !this.user.email || !this.user.password || !this.confirmPassword) {
            this.toast.error('Por favor completa todos los campos.');
            return;
        }
        if (this.user.password !== this.confirmPassword) {
            this.toast.error('Las contraseñas no coinciden.');
            return;
        }
        if (this.user.password.length < 8) {
            this.toast.error('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (!/[A-Z]/.test(this.user.password) || !/\d/.test(this.user.password)) {
            this.toast.error('La contraseña debe contener al menos una mayúscula y un número.');
            return;
        }

        const result = await this.accountStore.register(this.user);

        if (result.ok) {
            this.toast.success('Cuenta creada correctamente.');
            this.router.navigate(['/plan']);
        } else {
            this.toast.error(result.message ?? 'El correo ya está registrado.');
        }
    }
}
