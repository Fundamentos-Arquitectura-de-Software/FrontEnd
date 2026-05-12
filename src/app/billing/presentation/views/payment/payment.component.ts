import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountStore } from '../../../../accounts/application/accounts.store';

@Component({
    selector: 'fs-payment',
    standalone: true,
    templateUrl: './payment.component.html',
    imports: [FormsModule, TranslateModule],
    styleUrls: ['./payment.component.css']
})
export class PaymentView {
    constructor(private accountStore: AccountStore, private router: Router) {}

    async pay() {
        const user = this.accountStore.getCurrentUser();
        if (!user) {
            alert('Error: no se encontró usuario registrado ❌');
            return;
        }

        await this.accountStore.markAsPaid(user.email);

        alert('Pago realizado con éxito ✅');
        localStorage.removeItem('selectedPlan');

        this.router.navigate(['/login']);
    }
}
