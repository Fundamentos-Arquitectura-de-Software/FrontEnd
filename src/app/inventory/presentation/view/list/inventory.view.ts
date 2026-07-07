import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { InventoryApi } from '../../../infrastructure/inventory-api';
import { ProductResponse } from '../../../infrastructure/inventory-response';
import { Product } from '../../../domain/product.model';
import { environment } from '../../../../../environments/environment';
import { MonitoringApi } from '../../../../monitoring/infrastructure/monitoring-api';

@Component({
    selector: 'fs-inventory',
    standalone: true,
    imports: [NgFor, NgIf, FormsModule, CommonModule, TranslateModule],
    templateUrl: './inventory-list.html',
    styleUrls: ['./inventory.css']
})
export class FoodInventoryView implements OnInit {
    products: Product[] = [];
    filteredProducts: Product[] = [];
    searchTerm = '';

    states = ['All', 'In good condition', 'Regular condition', 'Bad condition', 'No sensor data'];
    // Categorías derivadas dinámicamente de los productos reales (antes lista fija en inglés que no coincidía).
    categories: string[] = ['All'];

    selectedState = 'All';
    selectedCategory = 'All';

    loading = true;
    readonly skeletons = [0, 1, 2, 3, 4, 5];

    selectedProduct: Product | null = null;

    private destroyRef = inject(DestroyRef);
    private readonly historyUrl = `${environment.apiBaseUrl}/history`;
    // Frescura ya clasificada por el Edge (semáforo) en la última lectura.
    private lastStatus: string | null = null;
    private lastCategory: string | null = null;

    constructor(
        private inventoryApi: InventoryApi,
        private router: Router,
        private http: HttpClient,
        private monitoringApi: MonitoringApi
    ) {}

    ngOnInit() {
        // La frescura ya viene clasificada por el Edge en la última lectura; aquí solo la mostramos.
        this.loadLatestThenProducts();
    }

    private loadLatestThenProducts() {
        this.monitoringApi.getLatest()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (r) => { this.lastStatus = r?.status ?? null; this.lastCategory = r?.category ?? null; this.loadProducts(); },
                error: () => this.loadProducts()
            });
    }

    private loadProducts() {
        this.inventoryApi.getProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: ProductResponse[]) => {
                this.products = (data ?? []).map(p => ({
                    id: p.id,
                    name: p.name,
                    image: p.imageUrl,
                    state: this.computeState(p.category, p.expirationDate),
                    category: p.category,
                    description: p.description,
                    quantity: typeof p.quantity === 'number' ? p.quantity : 0,
                    expirationDate: p.expirationDate,
                    createdAt: p.createdAt
                }));
                this.rebuildCategories();
                this.filteredProducts = [...this.products];
                this.loading = false;
            },
            error: () => {
                this.products = [];
                this.filteredProducts = [];
                this.loading = false;
            }
        });
    }

    private rebuildCategories() {
        const unique = Array.from(new Set(this.products.map(p => p.category).filter((c): c is string => !!c)));
        this.categories = ['All', ...unique];
    }

    /**
     * Estado de frescura combinado: manda el peor entre el semáforo del Edge (lectura
     * más reciente para la categoría del producto) y la cercanía de la fecha de
     * vencimiento (vencido = malo; vence en ≤2 días = al menos regular).
     * Sin sensor NI fecha: 'No sensor data'.
     */
    private computeState(category?: string, expirationDate?: string | null): string {
        const levels: number[] = [];

        // Semáforo del Edge (solo aplica a la categoría de la última lectura).
        if (this.lastStatus && this.lastCategory &&
            (category ?? '').toLowerCase() === this.lastCategory.toLowerCase()) {
            const sensor: Record<string, number> = { GREEN: 0, YELLOW: 1, RED: 2 };
            if (this.lastStatus in sensor) levels.push(sensor[this.lastStatus]);
        }

        // Cercanía de la fecha de vencimiento.
        const days = this.daysToExpiry(expirationDate);
        if (days !== null) {
            if (days < 0) levels.push(2);
            else if (days <= 2) levels.push(1);
            else levels.push(0);
        }

        if (!levels.length) return 'No sensor data';
        switch (Math.max(...levels)) {
            case 0:  return 'In good condition';
            case 1:  return 'Regular condition';
            default: return 'Bad condition';
        }
    }

    /** Días hasta el vencimiento (negativo = vencido); null si el producto no tiene fecha. */
    daysToExpiry(expirationDate?: string | null): number | null {
        if (!expirationDate) return null;
        const exp = new Date(`${expirationDate}T00:00:00`);
        if (isNaN(exp.getTime())) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.round((exp.getTime() - today.getTime()) / 86400000);
    }

    /** Clave i18n del estado de vencimiento, para el detalle de la card. */
    expiryKey(p: Product): string {
        const days = this.daysToExpiry(p.expirationDate);
        if (days === null) return 'inventory.expiry.none';
        if (days < 0)  return 'inventory.expiry.expired';
        if (days === 0) return 'inventory.expiry.today';
        if (days === 1) return 'inventory.expiry.tomorrow';
        return 'inventory.expiry.inDays';
    }

    expiryDays(p: Product): number {
        return Math.abs(this.daysToExpiry(p.expirationDate) ?? 0);
    }

    filterProducts() {
        const term = this.searchTerm.trim().toLowerCase();
        this.filteredProducts = this.products.filter((p) => {
            const stateMatch = this.selectedState === 'All' || p.state === this.selectedState;
            const categoryMatch = this.selectedCategory === 'All' || p.category === this.selectedCategory;
            const searchMatch = !term || p.name.toLowerCase().includes(term);
            return stateMatch && categoryMatch && searchMatch;
        });
    }

    trackByProductId(index: number, item: { id: string | number }) {
        return item?.id ?? index;
    }

    onAddProduct() {
        this.router.navigate(['/inventory/add']);
    }

    filterState(state: string) {
        this.selectedState = state;
        this.filterProducts();
    }

    filterCategory(category: string) {
        this.selectedCategory = category;
        this.filterProducts();
    }



    private static readonly THUMB_COLORS: Record<string, string> = {
        fruit:     '#dceede',
        vegetable: '#e2edda',
        dairy:     '#dde8f5',
        grain:     '#f2e9d8',
        meat:      '#f5dede',
        snack:     '#ecddf5',
        default:   '#e6eeea',
    };

    thumbBg(category: string): string {
        const key = category.toLowerCase();
        return FoodInventoryView.THUMB_COLORS[key] ?? FoodInventoryView.THUMB_COLORS['default'];
    }

    initial(name: string): string {
        return (name ?? '?').trim().charAt(0).toUpperCase();
    }

    onImgError(ev: Event) {
        const img = ev.target as HTMLImageElement;
        img.style.display = 'none';
    }

    openProduct(p: Product) {
        if (this.selectedProduct && this.selectedProduct.id === p.id) {
            this.selectedProduct = null;
        } else {
            this.selectedProduct = p;
        }
    }

    logAction(p: Product, action: string) {
        if (action === 'consume') {
            const newQty = Math.max((p.quantity ?? 0) - 1, 0);
            this.inventoryApi.updateProduct(p.id, { quantity: newQty })
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (updated) => {
                        p.quantity = updated.quantity;
                        this.postHistory(p, 'consume', 1);
                        this.filterProducts();
                    }
                });
        }

        if (action === 'discard') {
            this.inventoryApi.deleteProduct(p.id)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.postHistory(p, 'discard', p.quantity ?? 0);
                        this.products = this.products.filter(x => x.id !== p.id);
                        if (this.selectedProduct?.id === p.id) this.selectedProduct = null;
                        this.filterProducts();
                    }
                });
        }
    }

    private postHistory(p: Product, action: string, quantity: number) {
        // El backend (y el análisis premium US17) espera CONSUMED / DISCARDED.
        const backendAction = action === 'consume' ? 'CONSUMED' : 'DISCARDED';
        this.http.post(this.historyUrl, {
            productId: p.id,
            productName: p.name,
            category: p.category ?? '',
            action: backendAction,
            quantity
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
}
