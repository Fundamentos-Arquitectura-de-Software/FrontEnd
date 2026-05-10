import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export type Integration = { id:number; provider:string; status:'connected'|'disconnected' };
export type FridgeItem = { id:string; name:string; qty:number; unit:string; expiresAt:string };

@Injectable({ providedIn: 'root' })
export class IntegrationsService {
    private http = inject(HttpClient);
    private api = '/db.json'; // json-server o vite mock está sirviendo /public

    list(): Observable<Integration[]> {
        return this.http.get<any>(this.api).pipe(map(d => d.integrations as Integration[]));
    }

    toggle(id:number, next:'connected'|'disconnected'): Observable<boolean> {
        // solo frontend: persistimos en localStorage para simular
        const key = 'fs.integrations.'+id;
        localStorage.setItem(key, next);
        return of(true);
    }

    getStatus(id:number): 'connected'|'disconnected' {
        const v = localStorage.getItem('fs.integrations.'+id);
        return (v === 'connected' || v === 'disconnected') ? v : 'disconnected';
    }

    syncFridge(): Observable<FridgeItem[]> {
        return this.http.get<any>(this.api).pipe(map(d => d.fridgeSamples as FridgeItem[]));
    }
}
