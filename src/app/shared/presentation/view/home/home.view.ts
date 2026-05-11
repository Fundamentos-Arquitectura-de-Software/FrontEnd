import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AccountStore } from '../../../../accounts/application/accounts.store';
import { InventoryApi } from '../../../../inventory/infrastructure/inventory-api';

@Component({
    selector: 'fs-home-view',
    standalone: true,
    imports: [TranslateModule],
    templateUrl: './home.view.html',
    styleUrl: './home.view.css'
})
export class HomeView implements OnInit {

    private readonly accountStore = inject(AccountStore);
    private readonly inventoryApi = inject(InventoryApi);
    private readonly destroyRef = inject(DestroyRef);

    name = '';
    totalProducts = signal(0);
    freshnessScore = signal(0);

    ngOnInit(): void {
        const currentUser = this.accountStore.getCurrentUser();
        this.name = currentUser?.fullName ?? 'Guest';

        this.inventoryApi.getProducts()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (products) => {
                    this.totalProducts.set(products.length);
                    const avgQty = products.length
                        ? products.reduce((acc, p) => acc + (p.quantity ?? 0), 0) / products.length
                        : 0;
                    const score = Math.min(Math.round((avgQty / 10) * 100), 100);
                    this.freshnessScore.set(score);
                },
                error: () => {
                    this.totalProducts.set(0);
                    this.freshnessScore.set(0);
                }
            });
    }
}
