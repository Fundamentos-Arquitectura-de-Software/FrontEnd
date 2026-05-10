import { Injectable, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { InventoryApi } from '../infrastructure/inventory-api';
import { CreateProductRequest, ProductResponse } from '../infrastructure/inventory-response';

@Injectable({ providedIn: 'root' })
export class InventoryStore {

    private readonly _products = signal<ProductResponse[]>([]);
    readonly products = this._products.asReadonly();

    constructor(private readonly api: InventoryApi) {}

    async loadProducts(): Promise<void> {
        const res = await lastValueFrom(this.api.getProducts());
        this._products.set(res);
    }

    async addProduct(payload: CreateProductRequest): Promise<boolean> {
        try {
            const created = await lastValueFrom(this.api.createProduct(payload));
            this._products.update(list => [...list, created]);
            return true;
        } catch (err) {
            console.error('Error al crear producto', err);
            return false;
        }
    }
}
