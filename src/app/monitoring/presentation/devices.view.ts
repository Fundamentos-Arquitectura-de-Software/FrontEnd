import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DevicesApi, DeviceResponse, DeviceRegistrationResponse } from '../infrastructure/devices-api';

@Component({
    selector: 'fs-devices-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <section class="wrap" style="max-width:880px;margin:0 auto;padding:1rem;">
        <h2>Dispositivos IoT</h2>
        <p>Registra tu sensor (ESP32) para asociar sus lecturas a tu cuenta. El flujo es:
           <strong>IoT → Edge → Backend → App</strong>.</p>

        <form (ngSubmit)="register()" style="display:flex;gap:.5rem;flex-wrap:wrap;margin:1rem 0;">
            <input [(ngModel)]="deviceId" name="deviceId" placeholder="deviceId (ej. esp32-freshsense-1)" required
                   style="flex:1;min-width:220px;padding:.5rem;" />
            <input [(ngModel)]="name" name="name" placeholder="Nombre (ej. Refrigerador cocina)"
                   style="flex:1;min-width:200px;padding:.5rem;" />
            <button type="submit" [disabled]="submitting()" style="padding:.5rem 1rem;">Registrar</button>
        </form>

        <p *ngIf="error()" style="color:#c0392b;">{{ error() }}</p>

        <div *ngIf="lastRegistered() as d" style="border:1px solid #1f9c59;border-radius:8px;padding:1rem;margin-bottom:1rem;background:#f3fbf6;">
            <strong>Dispositivo registrado.</strong>
            <p style="margin:.5rem 0;">Ve al <strong>Edge</strong> (página de vinculación) e introduce este
               <strong>código de emparejamiento</strong>. Es de un solo uso y caduca en 10 minutos.</p>
            <p style="font-size:1.6rem;letter-spacing:.25rem;margin:.5rem 0;">
               <code>{{ d.pairingCode }}</code>
            </p>
            <p style="margin-top:.5rem;">Abre en el Edge: <code>http://&lt;ip-del-edge&gt;:5000/edge/setup</code>,
               pega el código y pulsa <em>Vincular</em>. No necesitas copiar ninguna clave secreta:
               el Edge la obtiene solo y la guarda de forma segura.</p>
        </div>

        <h3>Mis dispositivos</h3>
        <ul>
            <li *ngFor="let d of devices()">
                <strong>{{ d.deviceId }}</strong> — {{ d.name || 'sin nombre' }}
            </li>
            <li *ngIf="devices().length === 0">Aún no has registrado dispositivos.</li>
        </ul>
    </section>
    `,
})
export class DevicesView implements OnInit {
    private api = inject(DevicesApi);
    private destroyRef = inject(DestroyRef);

    deviceId = '';
    name = '';
    submitting = signal(false);
    error = signal<string | null>(null);
    devices = signal<DeviceResponse[]>([]);
    lastRegistered = signal<DeviceRegistrationResponse | null>(null);

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        this.api.list().pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: d => this.devices.set(d ?? []), error: () => {} });
    }

    register(): void {
        if (this.submitting() || !this.deviceId.trim()) return;
        this.submitting.set(true);
        this.error.set(null);
        this.api.register(this.deviceId.trim(), this.name.trim())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (d) => {
                    this.lastRegistered.set(d);
                    this.deviceId = '';
                    this.name = '';
                    this.submitting.set(false);
                    this.load();
                },
                error: (e) => {
                    this.error.set(e?.error?.message ?? 'No se pudo registrar el dispositivo.');
                    this.submitting.set(false);
                }
            });
    }
}
