import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HistoryEntry } from '../domain/history.model';

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly base = `${environment.apiBaseUrl}/history`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<HistoryEntry[]> {
    return this.http.get<HistoryEntry[]>(this.base);
  }

  create(entry: Omit<HistoryEntry, 'id' | 'date'>): Observable<HistoryEntry> {
    return this.http.post<HistoryEntry>(this.base, entry);
  }
}
