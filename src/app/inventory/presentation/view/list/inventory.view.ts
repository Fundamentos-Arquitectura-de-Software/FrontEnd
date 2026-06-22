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

interface CategoryThreshold {
    category: string;
    tempMin: number; tempMax: number;
    humidityMin: number; humidityMax: number;
}

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
    private thresholds: CategoryThreshold[] = [];
    private lastTemp: number | null = null;
    private lastHumidity: number | null = null;

    constructor(
        private inventoryApi: InventoryApi,
        private router: Router,
        private http: HttpClient,
        private monitoringApi: MonitoringApi
    ) {}

    ngOnInit() {
        // Carga umbrales y última lectura del sensor; luego los productos (para calcular su frescura).
        this.http.get<CategoryThreshold[]>(`${environment.apiBaseUrl}/thresholds`)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (t) => { this.thresholds = t ?? []; this.loadLatestThenProducts(); },
                error: () => this.loadLatestThenProducts()
            });
    }

    private loadLatestThenProducts() {
        this.monitoringApi.getLatest()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (r) => { this.lastTemp = r?.temperature ?? null; this.lastHumidity = r?.humidity ?? null; this.loadProducts(); },
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
                    state: this.computeState(p.category),
                    category: p.category,
                    description: p.description,
                    quantity: typeof p.quantity === 'number' ? p.quantity : 0
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
     * Estado de frescura derivado de la última lectura del sensor vs. el umbral de la categoría.
     * Sin lectura o sin umbral → 'No sensor data' (en vez de fingir "buen estado").
     */
    private computeState(category?: string): string {
        if (this.lastTemp === null && this.lastHumidity === null) return 'No sensor data';
        const th = this.thresholds.find(t => t.category.toLowerCase() === (category ?? '').toLowerCase());
        if (!th) return 'No sensor data';

        const within = (v: number | null, min: number, max: number) => v !== null && v >= min && v <= max;
        const near = (v: number | null, min: number, max: number) => {
            if (v === null) return false;
            const margin = (max - min) * 0.15;
            return (v >= min - margin && v < min) || (v > max && v <= max + margin);
        };

        const tempOk = within(this.lastTemp, th.tempMin, th.tempMax);
        const humOk = within(this.lastHumidity, th.humidityMin, th.humidityMax);
        if (tempOk && humOk) return 'In good condition';

        const tempNear = tempOk || near(this.lastTemp, th.tempMin, th.tempMax);
        const humNear = humOk || near(this.lastHumidity, th.humidityMin, th.humidityMax);
        if (tempNear && humNear) return 'Regular condition';

        return 'Bad condition';
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
