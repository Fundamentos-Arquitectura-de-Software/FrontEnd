import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'fs-plan',
    standalone: true,
    templateUrl: './plan.component.html',
    styleUrls: ['./plan.component.css'],
    imports: [TranslateModule]
})
export class PlanView {
    constructor(private router: Router) {}

    selectPlan(plan: string) {
        localStorage.setItem('selectedPlan', plan);
        this.router.navigate(['/payment']);
    }

}
