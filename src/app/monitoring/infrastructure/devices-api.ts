import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Dispositivo listado (sin secretos). */
export interface DeviceResponse {
    id: number;
    deviceId: string;
    name?: string;
    registeredAt: string;
}

/** Respuesta al registrar: código de emparejamiento (no la clave secreta). */
export interface DeviceRegistrationResponse {
    deviceId: string;
    name?: string;
    pairingCode: string;
    pairingExpiresAt: string;
}

const opts = { withCredentials: true };

@Injectable({ providedIn: 'root' })
export class DevicesApi {
    private base = `${environment.apiBaseUrl}/devices`;

    constructor(private http: HttpClient) {}

    register(deviceId: string, name: string): Observable<DeviceRegistrationResponse> {
        return this.http.post<DeviceRegistrationResponse>(this.base, { deviceId, name }, opts);
    }

    list(): Observable<DeviceResponse[]> {
        return this.http.get<DeviceResponse[]>(this.base, opts);
    }
}
