import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocialShareService } from '../application/social-share.service';
import { captureElementToPngBlob } from '../infrastructure/capture.util';
import { AchievementsApi } from '../infrastructure/achievements-api';
import { Achievement as AchievementDto, AchievementStatus } from '../domain/achievement.model';
import { AccountStore } from '../../accounts/application/accounts.store';

interface Achievement {
    id: string;
    icon: string;
    title: string;
    desc: string;
    progress?: number;
    status: AchievementStatus;
    pts: number;
}

function toStatus(pct: number): AchievementStatus {
    if (pct >= 100) return 'completed';
    if (pct > 0) return 'in-progress';
    return 'pending';
}

function iconFor(name: string): string {
    const map: Record<string, string> = {
        'Primer inicio de sesión': '🔑',
        'Completar perfil': '👤',
        'Primera acción en la app': '⚡',
    };
    return map[name] ?? '🏅';
}

@Component({
    selector: 'fs-achievements-view',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, TranslateModule],
    templateUrl: './achievements.view.html',
    styleUrl: './achievements.view.css'
})
export class AchievementsView implements OnInit {
    private readonly api = inject(AchievementsApi);
    private readonly accountStore = inject(AccountStore);
    private readonly destroyRef = inject(DestroyRef);

    constructor(private shareSvc: SocialShareService, private translate: TranslateService) {}

    private readonly all = signal<Achievement[]>([]);
    loading = signal(true);

    readonly inProgress = computed(() => this.all().filter(a => a.status === 'in-progress'));
    readonly pending     = computed(() => this.all().filter(a => a.status === 'pending'));
    readonly completed   = computed(() => this.all().filter(a => a.status === 'completed'));

    readonly tabs: { key: AchievementStatus | 'all'; label: string }[] = [
        { key: 'in-progress', label: 'In-Progress' },
        { key: 'pending',     label: 'Pending' },
        { key: 'completed',   label: 'Completed' },
        { key: 'all',         label: 'All' }
    ];
    activeTab = signal<AchievementStatus | 'all'>('in-progress');

    latestCompleted = computed(() => this.completed()[0] ?? this.all()[0]);

    count = {
        inProgress: computed(() => this.inProgress().length),
        pending:    computed(() => this.pending().length),
        completed:  computed(() => this.completed().length),
        all:        computed(() => this.all().length),
    };

    visible = computed(() => {
        const tab = this.activeTab();
        if (tab === 'in-progress') return this.inProgress();
        if (tab === 'pending')     return this.pending();
        if (tab === 'completed')   return this.completed();
        return this.all();
    });

    ngOnInit(): void {
        const user = this.accountStore.getCurrentUser();
        if (!user) return;

        this.api.init(user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            complete: () => this.loadAchievements(user.id),
            error: () => this.loadAchievements(user.id)
        });
    }

    private loadAchievements(userId: number): void {
        this.api.list(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: AchievementDto[]) => {
                this.all.set(data.map(a => ({
                    id: a.id,
                    icon: iconFor(a.name),
                    title: a.name,
                    desc: a.name,
                    progress: a.completionPercentage,
                    status: toStatus(a.completionPercentage),
                    pts: a.completionPercentage
                })));
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    setTab(key: AchievementStatus | 'all') { this.activeTab.set(key); }

    pts(n: number) { return `${n} pts`; }

    sharingId: string | null = null;
    lastShareMsg: { id: string; ok: boolean; text: string } | null = null;

    async share(a: Achievement, cardEl: HTMLElement) {
        this.lastShareMsg = null;
        this.sharingId = a.id;
        try {
            const img = await captureElementToPngBlob(cardEl);
            const status = await this.shareSvc.share({
                title: `FreshSense - ${a.title}`,
                text: `¡Logré "${a.title}"! (${this.pts(a.pts)}) #FreshSense #FoodWaste`,
                url: location.origin,
                imageBlob: img
            });
            this.lastShareMsg = {
                id: a.id,
                ok: status === 'ok' || status === 'unsupported',
                text: status === 'ok'
                    ? this.translate.instant('achievements.shared')
                    : this.translate.instant('achievements.sharedFallback')
            };
        } catch {
            this.lastShareMsg = { id: a.id, ok: false, text: this.translate.instant('achievements.shareFailed') };
        } finally {
            this.sharingId = null;
        }
    }
}
