import { environment } from '../../../environments/environment';

export const InventoryApiEndpoints = {
    base: `${environment.apiBaseUrl}/products`,
    catalog: `${environment.apiBaseUrl}/catalog`,
};
