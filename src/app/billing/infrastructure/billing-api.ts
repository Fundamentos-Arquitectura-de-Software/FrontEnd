import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Plan } from '../domain/plan.model';

@Injectable({ providedIn: 'root' })
export class BillingApi {
  private readonly base = `${environment.apiBaseUrl}/billing`;

  constructor(private http: HttpClient) {}

  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.base}/plans`);
  }
}
