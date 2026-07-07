import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryApiEndpoints } from './inventory-api-endpoints';
import { CreateProductRequest, ProductResponse, UpdateProductRequest } from './inventory-response';
import { CatalogItem } from '../domain/catalog-item.model';

const opts = { withCredentials: true };

@Injectable({ providedIn: 'root' })
export class InventoryApi {
    constructor(private http: HttpClient) {}

    getProducts(): Observable<ProductResponse[]> {
        return this.http.get<ProductResponse[]>(InventoryApiEndpoints.base, opts);
    }

    getCatalog(): Observable<CatalogItem[]> {
        return this.http.get<CatalogItem[]>(InventoryApiEndpoints.catalog, opts);
    }

    createProduct(payload: CreateProductRequest): Observable<ProductResponse> {
        return this.http.post<ProductResponse>(InventoryApiEndpoints.base, payload, opts);
    }

    updateProduct(id: number, payload: UpdateProductRequest): Observable<ProductResponse> {
        return this.http.patch<ProductResponse>(`${InventoryApiEndpoints.base}/${id}`, payload, opts);
    }

    deleteProduct(id: number): Observable<void> {
        return this.http.delete<void>(`${InventoryApiEndpoints.base}/${id}`, opts);
    }
}
