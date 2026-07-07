export interface Product {
  id: number;
  name: string;
  image?: string;
  state?: string;
  category?: string;
  description?: string;
  quantity?: number;
  expirationDate?: string | null;
  createdAt?: string | null;
}
