import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountStore } from '../../../application/accounts.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { NotificationsApi } from '../../../../notifications/infrastructure/notifications-api';
import { LanguageService } from '../../../../core/i18n/language.service';

const PREFS_KEY = 'fs.prefs';


type TabKey = 'profile' | 'preferences' | 'theme' | 'notifications' | 'security' | 'integrations';

interface SessionInfo { device: string; ip: string; lastActive: string; current?: boolean; }
interface Integration { key: string; name: string; connected: boolean; note?: string; }
interface Profile { name: string; email: string; phone: string; org: string; avatarUrl: string; }
interface Prefs { language: string; timezone: string; units: 'metric'|'imperial'; dateFormat: string; weekStartsOn: 'mon'|'sun'; }
interface Theme { mode: 'light'|'dark'|'system'; primary: string; rounded: boolean; density: 'comfortable'|'compact'; }
interface Notif { email: boolean; push: boolean; weeklyReport: boolean; criticalOnly: boolean; humidityThreshold: number; tempThreshold: number; }

// ---- US24: tipos de preferencias granulares de notificaciones
type Channel = 'inapp'|'push'|'email';
type NotifyKey = 'inventory.low' | 'inventory.expiring' | 'recipes.new' | 'achievements.unlocked';
type NotifyPrefs = Record<NotifyKey, { enabled:boolean; channels: Channel[] }>;

@Component({
    selector: 'fs-settings-view',
    standalone: true,
    imports: [FormsModule, NgFor, NgIf, DatePipe, TranslateModule],
    templateUrl: './settings.view.html',
    styleUrls: ['./settings.view.css'],
})
export class SettingsView {
    private readonly accountStore = inject(AccountStore);
    private readonly toast = inject(ToastService);
    private readonly translate = inject(TranslateService);
    private readonly notificationsApi = inject(NotificationsApi);
    private readonly languageService = inject(LanguageService);

    // Cambio de contraseña
    pwCurrent = '';
    pwNew = '';
    pwSubmitting = signal(false);
    profileSubmitting = signal(false);

    // Tabs
    tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: 'profile',       label: 'Profile',       icon: 'person' },
        { key: 'preferences',   label: 'Preferences',   icon: 'tune' },
        { key: 'theme',         label: 'Theme',         icon: 'palette' },
        { key: 'notifications', label: 'Notifications', icon: 'notifications' },
        { key: 'security',      label: 'Security',      icon: 'lock' },
        { key: 'integrations',  label: 'Integrations',  icon: 'hub' },
    ];
    active = signal<TabKey>('profile');
    setTab(k: TabKey){ this.active.set(k); }
    isActive = (k: TabKey) => this.active() === k;

    // Profile
    profile = signal<Profile>({
        name: '',
        email: '',
        phone: '+51 999 999 999',
        org: 'FreshSense Labs',
        avatarUrl: '',
    });

    constructor() {
        // Leemos al usuario actual del AccountStore / localStorage
        const current = this.accountStore.getCurrentUser();
        if (current) {
            this.profile.set({
                ...this.profile(),
                name: current.fullName ?? '',
                email: current.email ?? '',
            });
        }
        // Carga las preferencias de notificación reales desde el backend.
        this.notificationsApi.getPreferences().subscribe({
            next: (p) => this.notif.set({
                ...this.notif(),
                email: p.emailEnabled,
                push: p.pushEnabled,
            }),
            error: () => { /* usa los valores por defecto */ },
        });

        // Preferencias locales (idioma / zona / unidades) desde el dispositivo.
        this.prefs.set({ ...this.prefs(), ...this.loadPrefs(), language: this.languageService.current() });
    }

    private loadPrefs(): Partial<Prefs> {
        try {
            const raw = localStorage.getItem(PREFS_KEY);
            if (raw) return JSON.parse(raw) as Partial<Prefs>;
        } catch {}
        return {};
    }

    /** Persiste las preferencias de notificación en el backend (US09/US24). */
    private persistNotificationPrefs(): void {
        const n = this.notif();
        this.notificationsApi.updatePreferences({
            inAppEnabled: true,
            emailEnabled: n.email,
            pushEnabled: n.push,
            quietStart: null,
            quietEnd: null,
        }).subscribe({ error: () => {} });
    }

    setProfile<K extends keyof Profile>(k: K, v: Profile[K]) {
        this.profile.set({ ...this.profile(), [k]: v });
        this.markDirty();
    }

    /** Guarda el nombre del perfil en el backend. */
    async saveProfile(){
        const name = this.profile().name.trim();
        if (!name) { this.toast.warning(this.translate.instant('settings.profile.name')); return; }
        this.profileSubmitting.set(true);
        const res = await this.accountStore.updateProfile(name);
        this.profileSubmitting.set(false);
        if (res.ok) {
            this.dirty.set(false);
            this.toast.success(this.translate.instant('settings.profile.save'));
        } else {
            this.toast.error(res.message ?? this.translate.instant('settings.profile.saveError'));
        }
    }

    // Preferences
    prefs = signal<Prefs>({
        language: 'es',
        timezone: 'America/Lima',
        units: 'metric',
        dateFormat: 'DD/MM/YYYY',
        weekStartsOn: 'mon',
    });
    // Solo idiomas realmente soportados (con traducciones).
    languages = ['es','en'];
    timezones = ['America/Lima','America/Mexico_City','America/Bogota','UTC'];
    setPrefs<K extends keyof Prefs>(k: K, v: Prefs[K]) {
        this.prefs.set({ ...this.prefs(), [k]: v });
        // El idioma se aplica al instante.
        if (k === 'language' && (v === 'es' || v === 'en')) {
            this.languageService.use(v as 'en' | 'es');
        }
        this.markDirty();
    }

    // Guarda preferencias (locales + notificaciones granulares US24 + básicas en backend US09)
    savePrefs(){
        localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs()));
        localStorage.setItem('fs.notify.prefs', JSON.stringify(this.notifyPrefs));
        this.persistNotificationPrefs();
        this.dirty.set(false);
        this.toast.success(this.translate.instant('settings.preferences.save'));
    }

    // Theme
    theme = signal<Theme>({
        mode: 'system',
        primary: '#1f9c59',
        rounded: true,
        density: 'comfortable',
    });
    setTheme<K extends keyof Theme>(k: K, v: Theme[K]) {
        this.theme.set({ ...this.theme(), [k]: v });
        this.markDirty();
    }
    applyTheme(){ this.toast.success(this.translate.instant('settings.theme.apply')); }

    // Notifications (básicas)
    notif = signal<Notif>({
        email: true,
        push: false,
        weeklyReport: true,
        criticalOnly: true,
        humidityThreshold: 80,
        tempThreshold: 6,
    });
    setNotif<K extends keyof Notif>(k: K, v: Notif[K]) {
        this.notif.set({ ...this.notif(), [k]: v });
        this.markDirty();
    }
    resetNotif(){
        this.notif.set({ email:true, push:false, weeklyReport:true, criticalOnly:true, humidityThreshold:80, tempThreshold:6 });
    }

    // ---- US24: Notificaciones personalizadas (granulares)
    private defaultNotify: NotifyPrefs = {
        'inventory.low':        { enabled: true,  channels: ['inapp'] },
        'inventory.expiring':   { enabled: true,  channels: ['inapp','push'] },
        'recipes.new':          { enabled: false, channels: ['inapp'] },
        'achievements.unlocked':{ enabled: true,  channels: ['inapp'] }
    };
    notifyPrefs: NotifyPrefs = this.loadNotifyPrefs();
    prefKeys: NotifyKey[] = Object.keys(this.notifyPrefs) as NotifyKey[];

    private loadNotifyPrefs(): NotifyPrefs {
        try {
            const raw = localStorage.getItem('fs.notify.prefs');
            if (raw) return JSON.parse(raw) as NotifyPrefs;
        } catch {}
        return structuredClone(this.defaultNotify);
    }

    has(k: NotifyKey, ch: Channel) { return this.notifyPrefs[k].channels.includes(ch); }
    toggleCh(k: NotifyKey, ch: Channel, e: Event){
        const checked = (e.target as HTMLInputElement).checked;
        const arr = this.notifyPrefs[k].channels;
        if (checked && !arr.includes(ch)) arr.push(ch);
        if (!checked) this.notifyPrefs[k].channels = arr.filter(x=>x!==ch);
        this.markDirty();
    }

    async tryPush(){
        if (!('Notification' in window)) { this.toast.warning('Notifications API not available'); return; }
        if (Notification.permission === 'default') await Notification.requestPermission();
        if (Notification.permission === 'granted') {
            new Notification('FreshSense', { body: 'Test notification sent successfully.' });
        }
    }

    // Security
    twoFA = signal(false);
    // Solo la sesión actual (no inventamos sesiones falsas: no hay backend de gestión de sesiones).
    sessions = signal<SessionInfo[]>([
        { device: 'Esta sesión', ip: '—', lastActive: 'Ahora', current: true },
    ]);
    /** Cambia la contraseña contra el backend (verifica la actual). */
    async changePassword(){
        const current = this.pwCurrent.trim();
        const next = this.pwNew.trim();
        if (!current || !next) {
            this.toast.warning(this.translate.instant('settings.security.passwordRequired'));
            return;
        }
        if (next.length < 8 || !/[A-Z]/.test(next) || !/\d/.test(next)) {
            this.toast.warning(this.translate.instant('settings.security.passwordWeak'));
            return;
        }
        this.pwSubmitting.set(true);
        const res = await this.accountStore.changePassword(current, next);
        this.pwSubmitting.set(false);
        if (res.ok) {
            this.pwCurrent = '';
            this.pwNew = '';
            this.toast.success(this.translate.instant('settings.security.passwordChanged'));
        } else {
            this.toast.error(res.message ?? this.translate.instant('settings.security.passwordError'));
        }
    }
    toggle2FA(){ this.twoFA.set(!this.twoFA()); }
    revokeSession(i: number){
        const arr = this.sessions().slice();
        const [s] = arr.splice(i,1);
        this.toast.warning(`${this.translate.instant('settings.security.revoke')}: ${s.device}`);
        this.sessions.set(arr);
    }

    // Integrations
    // Integraciones disponibles (todas desconectadas: no hay backend de integraciones aún).
    integrations = signal<Integration[]>([
        { key:'google',   name:'Google',   connected:false, note:'Calendar & Drive export' },
        { key:'slack',    name:'Slack',    connected:false, note:'#freshsense channel' },
        { key:'zapier',   name:'Zapier',   connected:false },
        { key:'webhooks', name:'Webhooks', connected:false },
    ]);
    connect(i: Integration){
        i.connected = !i.connected;
        this.integrations.set([...this.integrations()]);
    }

    // ---- US22: Smart fridges (frontend mock con localStorage)
    providers = [
        { id: 1, provider: 'Samsung SmartThings' },
        { id: 2, provider: 'LG ThinQ' }
    ];
    lastSync?: Date;
    importedCount = -1;

    status(p: {id:number}) : 'connected'|'disconnected' {
        const v = localStorage.getItem('fs.integrations.'+p.id);
        return (v === 'connected' || v === 'disconnected') ? v : 'disconnected';
    }

    toggle(p: {id:number}){
        const next = this.status(p) === 'connected' ? 'disconnected' : 'connected';
        localStorage.setItem('fs.integrations.'+p.id, next);
    }

    async sync(){
        // Intenta leer /db.json; si falla, usa fallback
        try {
            const res = await fetch('/db.json');
            if (res.ok) {
                const data = await res.json();
                this.importedCount = Array.isArray(data?.fridgeSamples) ? data.fridgeSamples.length : 0;
            } else {
                this.importedCount = 0;
            }
        } catch {
            // fallback si no hay /db.json accesible
            this.importedCount = 2;
        }
        this.lastSync = new Date();
    }

    // Unsaved changes flag
    dirty = signal(false);
    markDirty(){ this.dirty.set(true); }
    saveAll(){
        localStorage.setItem('fs.notify.prefs', JSON.stringify(this.notifyPrefs));
        this.persistNotificationPrefs();
        this.dirty.set(false);
        this.toast.success(this.translate.instant('settings.saveAll'));
    }
}
