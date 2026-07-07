/**
 * Alimento del catálogo general del backend (`GET /api/catalog`).
 * Su `category` siempre es una de las 7 categorías de umbrales del Edge,
 * así el producto creado desde el catálogo tiene semáforo de frescura.
 */
export interface CatalogItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  imageUrl?: string;
}
