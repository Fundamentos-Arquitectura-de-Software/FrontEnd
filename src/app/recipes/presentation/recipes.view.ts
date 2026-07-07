import { Component, HostListener, OnInit, DestroyRef, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Recipe } from '../domain/recipe.model';

/** Lo mínimo que necesitamos del inventario para recomendar (evita acoplar módulos). */
interface OwnedProduct {
    name: string;
}

const MAX_RECOMMENDED = 6;

@Component({
    standalone: true,
    selector: 'app-recipes-view',
    templateUrl: './recipes.view.html',
    styleUrl: './recipes.view.css',
    imports: [NgFor, NgIf, FormsModule, TranslateModule],
})
export class RecipesView implements OnInit {
    recipes: Recipe[] = [];
    filteredRecipes: Recipe[] = [];

    recommended: Recipe[] = [];
    showAll = false;
    private matchCount = new Map<number, number>();

    searchTerm = '';
    selectedLevel = 'All';
    selectedType = 'All';

    loading = true;
    generating = false; // loading específico para la generación con IA
    readonly skeletons = [0, 1, 2, 3, 4, 5];

    modalOpen = false;
    active: Recipe | null = null;

    private readonly apiUrl = `${environment.apiBaseUrl}/recipes`;
    private readonly productsUrl = `${environment.apiBaseUrl}/products`;
    private destroyRef = inject(DestroyRef);

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        this.loadRecipes();
    }

    private loadRecipes(): void {
        forkJoin({
            recipes: this.http
                .get<Recipe[]>(this.apiUrl, { withCredentials: true })
                .pipe(catchError(() => of([] as Recipe[]))),
            products: this.http
                .get<OwnedProduct[]>(this.productsUrl, { withCredentials: true })
                .pipe(catchError(() => of([] as OwnedProduct[]))),
        })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(({ recipes, products }) => {
                this.recipes = recipes ?? [];
                this.filteredRecipes = [...this.recipes];
                this.matchCount.clear();
                this.buildRecommendations(products ?? []);
                this.showAll = this.recommended.length === 0;
                this.loading = false;
            });
    }

    /** Se llama al presionar el botón: genera un catálogo nuevo con IA y recarga la vista. */
    generateNewRecipes(): void {
        this.generating = true;

        this.http
            .post<Recipe[]>(`${this.apiUrl}/generate-batch`, {}, { withCredentials: true })
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                catchError(() => of(null)),
            )
            .subscribe(() => {
                this.generating = false;
                this.loading = true;
                this.loadRecipes();
            });
    }

    /** Puntúa cada receta por cuántos alimentos del inventario aparecen en sus ingredientes. */
    private buildRecommendations(products: OwnedProduct[]): void {
        const tokens = new Set<string>();
        for (const p of products) {
            for (const word of this.normalize(p.name).split(/\s+/)) {
                if (word.length >= 3) tokens.add(this.singular(word));
            }
        }
        if (!tokens.size) return;

        for (const recipe of this.recipes) {
            const words = new Set(
                this.normalize((recipe.ingredients ?? []).join(' '))
                    .split(/\s+/)
                    .map((w) => this.singular(w)),
            );
            let count = 0;
            tokens.forEach((t) => {
                if (words.has(t)) count++;
            });
            if (count > 0) this.matchCount.set(recipe.id, count);
        }

        this.recommended = this.recipes
            .filter((r) => this.matchCount.has(r.id))
            .sort((a, b) => (this.matchCount.get(b.id) ?? 0) - (this.matchCount.get(a.id) ?? 0))
            .slice(0, MAX_RECOMMENDED);
    }

    matchesFor(recipe: Recipe): number {
        return this.matchCount.get(recipe.id) ?? 0;
    }

    toggleShowAll(showAll: boolean): void {
        this.showAll = showAll;
    }

    get visibleRecipes(): Recipe[] {
        return this.showAll ? this.filteredRecipes : this.recommended;
    }

    private normalize(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '');
    }

    /** Iguala plural/singular simple: "manzanas" y "manzana" cuentan como el mismo token. */
    private singular(word: string): string {
        return word.endsWith('s') && word.length > 3 ? word.slice(0, -1) : word;
    }

    filterRecipes(): void {
        const term = this.searchTerm.trim().toLowerCase();

        this.filteredRecipes = this.recipes.filter((r) => {
            const matchesText =
                !term ||
                r.title.toLowerCase().includes(term) ||
                (r.description ?? '').toLowerCase().includes(term);

            const matchesLevel =
                this.selectedLevel === 'All' ||
                (r.level ?? '').toLowerCase() === this.selectedLevel.toLowerCase();

            const matchesType =
                this.selectedType === 'All' ||
                (r.type ?? '').toLowerCase() === this.selectedType.toLowerCase();

            return matchesText && matchesLevel && matchesType;
        });
    }

    filterLevel(level: string): void {
        this.selectedLevel = level;
        this.filterRecipes();
    }

    filterType(type: string): void {
        this.selectedType = type;
        this.filterRecipes();
    }

    imageFor(recipe: Recipe | null | undefined): string {
        if (!recipe) return this.defaultFoodImage();
        if (recipe.image && recipe.image.trim().length > 0) return recipe.image;
        return this.defaultFoodImage();
    }

    onImgError(event: Event): void {
        const img = event.target as HTMLImageElement | null;
        if (img) {
            img.src = this.defaultFoodImage();
        }
    }

    getStars(rating?: number): number[] {
        const n = !rating || rating < 0 ? 0 : Math.min(Math.round(rating), 5);
        return Array.from({ length: n });
    }

    private defaultFoodImage(): string {
        return 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=960&h=720&dpr=1';
    }

    openModal(recipe: Recipe): void {
        this.active = recipe;
        this.modalOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeModal(): void {
        this.modalOpen = false;
        this.active = null;
        document.body.style.overflow = '';
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.modalOpen) this.closeModal();
    }
}
