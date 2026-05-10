import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AccountStore } from '../../../../accounts/application/accounts.store';

@Component({
    selector: 'fs-home-view',
    standalone: true,
    imports: [TranslateModule],
    templateUrl: './home.view.html',
    styleUrl: './home.view.css'
})
export class HomeView implements OnInit {

    private readonly accountStore = inject(AccountStore);

    name = '';

    ngOnInit(): void {
        const currentUser = this.accountStore.getCurrentUser();
        // Ajusta al nombre que venga en AuthResponse: fullName / name / username
        this.name = currentUser?.fullName ?? 'Invitado';
    }
}
