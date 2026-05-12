import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Recipe } from '../domain/recipe.model';

const opts = { withCredentials: true };

@Injectable({ providedIn: 'root' })
export class RecipesApi {
    private readonly base = `${environment.apiBaseUrl}/recipes`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<Recipe[]> {
        return this.http.get<Recipe[]>(this.base, opts);
    }

    getById(id: number): Observable<Recipe> {
        return this.http.get<Recipe>(`${this.base}/${id}`, opts);
    }

    create(recipe: Omit<Recipe, 'id'>): Observable<Recipe> {
        return this.http.post<Recipe>(this.base, recipe, opts);
    }
}
