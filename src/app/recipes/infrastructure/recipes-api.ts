import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Recipe } from '../domain/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipesApi {
  private readonly base = `${environment.apiBaseUrl}/recipes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Recipe[]> {
    return this.http.get<Recipe[]>(this.base);
  }

  getById(id: number): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.base}/${id}`);
  }
}
