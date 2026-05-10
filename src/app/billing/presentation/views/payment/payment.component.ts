import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountStore } from '../../../../accounts/application/accounts.store'; //

@Component({
    selector: 'app-payment',
    standalone: true,
    templateUrl: './payment.component.html',
    imports: [FormsModule, TranslateModule], // ⬅️ agregado
    styleUrls: ['./payment.component.css']
})
export class PaymentComponent {
    constructor(private accountStore: AccountStore, private router: Router) {}

    async pay() {
        const email = localStorage.getItem('registerEmail');
        if (!email) {
            alert('Error: no se encontró usuario registrado ❌');
            return;
        }

        // Marcar como pagado en db.json
        await this.accountStore.markAsPaid(email);

        alert('Pago realizado con éxito ✅');
        // Limpiar localStorage de registro temporal
        localStorage.removeItem('registerEmail');
        localStorage.removeItem('selectedPlan');

        this.router.navigate(['/login']);
    }

}
