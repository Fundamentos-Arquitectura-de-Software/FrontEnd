import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AccountStore } from '../../../application/accounts.store';
import { User } from '../../../domain/model/user.entity';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [FormsModule, CommonModule, TranslateModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    user: User = {
        name: '',
        email: '',
        password: ''
    };

    confirmPassword: string = '';

    constructor(private accountStore: AccountStore, private router: Router) {}
    goToLogin() {
        this.router.navigate(['/login']);

    }async onSubmit() {
        if (!this.user.name || !this.user.email || !this.user.password || !this.confirmPassword) {
            alert('No ha llenado todos los campos ❌');
            return;
        }

        if (this.user.password !== this.confirmPassword) {
            alert('Las contraseñas no coinciden ❌');
            return;
        }

        const success = await this.accountStore.register(this.user);

        if (success) {
            alert('Usuario registrado correctamente ✅');
            // Guardar correo en localStorage para usarlo en Plan/Payment
            localStorage.setItem('registerEmail', this.user.email);
            this.router.navigate(['/plan']); // ⬅️ pantalla de selección de plan
        } else {
            alert('Usuario ya registrado. Registra uno nuevo ❌');
        }
    }



}
