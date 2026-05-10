import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

type Recipe = {
    id: number;
    title: string;
    description?: string;
    image?: string;
    rating?: number;
    level?: string;
    type?: string;
    time?: string;
    ingredients?: string[];
    steps?: string[];
};

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

    /** Filtros y búsqueda */
    searchTerm = '';
    selectedLevel = 'All';
    selectedType = 'All';

    /** Modal de detalle */
    modalOpen = false;
    active: Recipe | null = null;

    private readonly apiUrl = `${environment.apiBaseUrl}/recipes`;

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        this.loadRecipes();
    }

    private loadRecipes(): void {
        this.http.get<Recipe[]>(this.apiUrl).subscribe({
            next: (data) => {
                this.recipes = data ?? [];
                this.filteredRecipes = [...this.recipes];
            },
            error: (err) => {
                console.error('Error loading recipes from backend', err);
                this.recipes = [];
                this.filteredRecipes = [];
            },
        });
    }

    // ==========================
    //   FILTROS Y BÚSQUEDA
    // ==========================
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

    // ==========================
    //   IMÁGENES Y RATING
    // ==========================
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

    // ==========================
    //   MODAL
    // ==========================
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
