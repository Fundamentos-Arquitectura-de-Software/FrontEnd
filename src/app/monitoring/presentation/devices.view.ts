import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DevicesApi, DeviceResponse, DeviceRegistrationResponse } from '../infrastructure/devices-api';

@Component({
    selector: 'fs-devices-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './devices.view.html',
    styleUrls: ['./devices.view.css'],
})
export class DevicesView implements OnInit {
    private api = inject(DevicesApi);
    private destroyRef = inject(DestroyRef);

    deviceId = '';
    name = '';
    submitting = signal(false);
    error = signal<string | null>(null);
    copied = signal(false);
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
        this.copied.set(false);
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

    copyCode(code: string): void {
        navigator.clipboard?.writeText(code).then(
            () => { this.copied.set(true); setTimeout(() => this.copied.set(false), 2000); },
            () => {}
        );
    }

    initial(name?: string): string {
        return (name ?? '?').trim().charAt(0).toUpperCase() || 'D';
    }
}
