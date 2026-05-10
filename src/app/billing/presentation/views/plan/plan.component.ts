import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-plan',
    standalone: true,
    templateUrl: './plan.component.html',
    styleUrls: ['./plan.component.css'],
    imports: [TranslateModule] // ⬅️ agregado
})
export class PlanComponent {
    constructor(private router: Router) {}

    selectPlan(plan: string) {
        console.log('Plan seleccionado:', plan);
        // Guardar el plan en localStorage si lo necesitas
        localStorage.setItem('selectedPlan', plan);
        this.router.navigate(['/payment']);
    }

}
