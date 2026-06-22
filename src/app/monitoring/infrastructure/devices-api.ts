import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DeviceResponse {
    id: number;
    deviceId: string;
    name?: string;
    secretKey?: string;
    registeredAt: string;
}

const opts = { withCredentials: true };

@Injectable({ providedIn: 'root' })
export class DevicesApi {
    private base = `${environment.apiBaseUrl}/devices`;

    constructor(private http: HttpClient) {}

    register(deviceId: string, name: string): Observable<DeviceResponse> {
        return this.http.post<DeviceResponse>(this.base, { deviceId, name }, opts);
    }

    list(): Observable<DeviceResponse[]> {
        return this.http.get<DeviceResponse[]>(this.base, opts);
    }
}
