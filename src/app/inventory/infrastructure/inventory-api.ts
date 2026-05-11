import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryApiEndpoints } from './inventory-api-endpoints';
import { CreateProductRequest, ProductResponse, UpdateProductRequest } from './inventory-response';

@Injectable({ providedIn: 'root' })
export class InventoryApi {
    constructor(private http: HttpClient) {}

    getProducts(): Observable<ProductResponse[]> {
        return this.http.get<ProductResponse[]>(InventoryApiEndpoints.base);
    }

    createProduct(payload: CreateProductRequest): Observable<ProductResponse> {
        return this.http.post<ProductResponse>(InventoryApiEndpoints.base, payload);
    }

    updateProduct(id: number, payload: UpdateProductRequest): Observable<ProductResponse> {
        return this.http.patch<ProductResponse>(`${InventoryApiEndpoints.base}/${id}`, payload);
    }

    deleteProduct(id: number): Observable<void> {
        return this.http.delete<void>(`${InventoryApiEndpoints.base}/${id}`);
    }
}
