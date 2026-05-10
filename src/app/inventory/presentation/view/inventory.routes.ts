import { Routes } from '@angular/router';
import { FoodInventoryView } from './list/inventory.view';
import { InventoryAddComponent } from './form/inventory-form';

export const INVENTORY_ROUTES: Routes = [
    { path: '', component: FoodInventoryView },
    { path: 'add', component: InventoryAddComponent },
];
