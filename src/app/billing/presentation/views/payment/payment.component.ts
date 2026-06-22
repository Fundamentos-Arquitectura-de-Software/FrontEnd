import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountStore } from '../../../../accounts/application/accounts.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { BillingApi } from '../../../infrastructure/billing-api';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'fs-payment',
    standalone: true,
    templateUrl: './payment.component.html',
    imports: [FormsModule, TranslateModule],
    styleUrls: ['./payment.component.css']
})
export class PaymentView {
    isSubmitting = false;

    constructor(
        private accountStore: AccountStore,
        private router: Router,
        private toast: ToastService,
        private billingApi: BillingApi
    ) {}

    async pay() {
        if (this.isSubmitting) return;

        const user = this.accountStore.getCurrentUser();
        if (!user) {
            this.toast.error('No se encontró usuario registrado.');
            return;
        }

        const selectedPlan = localStorage.getItem('selectedPlan');
        const planId = selectedPlan ? Number(selectedPlan) : 1;

        this.isSubmitting = true;
        try {
            // Pago simulado (sin pasarela real): referencia de demo. Activa la suscripción premium.
            await firstValueFrom(this.billingApi.subscribe(planId, 'DEMO-REF-' + Date.now()));
            // Renueva el token para que el rol USER_PREMIUM surta efecto inmediatamente.
            await this.accountStore.refreshAfterRoleChange();
            this.toast.success('Pago realizado con éxito. ¡Ya eres premium!');
            localStorage.removeItem('selectedPlan');
            this.router.navigate(['/dashboard']);
        } catch {
            this.toast.error('No se pudo procesar el pago. Intenta de nuevo.');
        } finally {
            this.isSubmitting = false;
        }
    }
}
