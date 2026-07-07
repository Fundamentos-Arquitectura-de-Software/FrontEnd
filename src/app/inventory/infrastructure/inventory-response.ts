export interface ProductResponse {
    id: number;
    name: string;
    description: string;
    category: string;
    quantity: number;
    imageUrl: string;
    expirationDate: string | null;
    createdAt: string | null;
}

export interface CreateProductRequest {
    name: string;
    description: string;
    category: string;
    quantity: number;
    imageUrl: string;
    expirationDate: string;
}

export interface UpdateProductRequest {
    quantity?: number;
    expirationDate?: string;
}
