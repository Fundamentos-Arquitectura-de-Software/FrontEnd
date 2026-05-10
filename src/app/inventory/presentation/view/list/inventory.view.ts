import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../../../environments/environment';

type Product = {
    id: number;
    name: string;
    image?: string;
    state?: string;
    category?: string;
    description?: string;
    quantity?: number;
};

// cómo responde tu backend Spring Boot
type BackendProductResponse = {
    id: number;
    name: string;
    description: string;
    category: string;
    quantity: number;
    imageUrl: string;
};

@Component({
    selector: 'fs-inventory',
    standalone: true,
    imports: [NgFor, NgIf, FormsModule, CommonModule, HttpClientModule, TranslateModule],
    templateUrl: './inventory-list.html',
    styleUrls: ['./inventory.css']
})
export class FoodInventoryView implements OnInit {
    products: Product[] = [];
    filteredProducts: Product[] = [];
    searchTerm = '';

    states = ['All', 'In good condition', 'Regular condition', 'Bad condition'];
    categories = ['All', 'Vegetables', 'Fruits', 'Lactates', 'Meats'];

    selectedState = 'All';
    selectedCategory = 'All';

    private readonly apiUrl = `${environment.apiBaseUrl}/products`;

    constructor(private http: HttpClient, private router: Router) {}

    ngOnInit() {
        this.http.get<BackendProductResponse[]>(this.apiUrl)
            .subscribe({
                next: (data) => {
                    this.products = (data ?? []).map(p => ({
                        id: p.id,
                        name: p.name,
                        image: p.imageUrl,
                        state: 'In good condition',   // estado por defecto
                        category: p.category,
                        description: p.description,
                        quantity: typeof p.quantity === 'number' ? p.quantity : 0
                    })) as Product[];

                    this.filteredProducts = [...this.products];
                },
                error: (err) => {
                    console.error('Error loading products from backend', err);
                    this.products = [];
                    this.filteredProducts = [];
                }
            });
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

    imageFor(p: Product) {
        return p.image ||
            'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1';
    }

    onImgError(ev: Event) {
        (ev.target as HTMLImageElement).src =
            'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1';
    }

    selectedProduct: Product | null = null;

    openProduct(p: Product) {
        if (this.selectedProduct && this.selectedProduct.id === p.id) {
            this.selectedProduct = null;
        } else {
            this.selectedProduct = p;
        }
    }

    logAction(p: Product, action: string) {
        console.log('Action on product', { productId: p.id, action });

        if (action === 'discard') {
            p.state = 'Bad condition';
        }
        if (action === 'consume') {
            const currentQty = p.quantity ?? 0;
            p.quantity = Math.max(currentQty - 1, 0);
            if (p.quantity === 0) {
                p.state = 'Regular condition';
            }
        }
        this.filterProducts();
    }
}