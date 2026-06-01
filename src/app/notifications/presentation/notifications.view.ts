import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationsApi } from '../infrastructure/notifications-api';
import { Notification } from '../domain/notification.model';

@Component({
    selector: 'fs-notifications-view',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, DatePipe, TranslateModule],
    templateUrl: './notifications.view.html',
    styleUrls: ['./notifications.view.css'],
})
export class NotificationsView implements OnInit {
    private readonly api = inject(NotificationsApi);
    private readonly destroyRef = inject(DestroyRef);

    private _notifications = signal<Notification[]>([]);
    loading = signal(true);
    error = signal(false);

    readonly unread = computed(() => this._notifications().filter(n => !n.isRead));
    readonly all = computed(() => this._notifications());

    ngOnInit(): void {
        this.api.getInbox().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: data => {
                this._notifications.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.error.set(true);
            }
        });
    }

    markAsRead(n: Notification): void {
        if (n.isRead) return;
        this.api.markAsRead(n.id).subscribe({
            next: () => {
                this._notifications.update(list =>
                    list.map(item => item.id === n.id ? { ...item, isRead: true } : item)
                );
            }
        });
    }

    markAllAsRead(): void {
        this.unread().forEach(n => this.markAsRead(n));
    }
}
