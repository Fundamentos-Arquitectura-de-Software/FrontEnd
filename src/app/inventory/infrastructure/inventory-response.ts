export interface ProductResponse {
    id: number;
    name: string;
    description: string;
    category: string;
    quantity: number;
    imageUrl: string;
}

export interface CreateProductRequest {
    name: string;
    description: string;
    category: string;
    quantity: number;
    imageUrl: string;
}
