import { Component, signal,inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AccountStore } from '../../../application/accounts.store';  // 👈 ESTA ES LA RUTA


type TabKey = 'profile' | 'preferences' | 'theme' | 'notifications' | 'security' | 'integrations';

interface SessionInfo { device: string; ip: string; lastActive: string; current?: boolean; }
interface Integration { key: string; name: string; connected: boolean; note?: string; }
interface Profile { name: string; email: string; phone: string; org: string; avatarUrl: string; }
interface Prefs { language: string; timezone: string; units: 'metric'|'imperial'; dateFormat: string; weekStartsOn: 'mon'|'sun'; }
interface Theme { mode: 'light'|'dark'|'system'; primary: string; rounded: boolean; density: 'comfortable'|'compact'; }
interface Notif { email: boolean; push: boolean; weeklyReport: boolean; criticalOnly: boolean; ethyleneThreshold: number; tempThreshold: number; }

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

    // Tabs
    tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: 'profile',       label: 'Profile',       icon: '👤' },
        { key: 'preferences',   label: 'Preferences',   icon: '⚙️' },
        { key: 'theme',         label: 'Theme',         icon: '🎨' },
        { key: 'notifications', label: 'Notifications', icon: '🔔' },
        { key: 'security',      label: 'Security',      icon: '🔒' },
        { key: 'integrations',  label: 'Integrations',  icon: '🔗' },
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
        // 👉 aquí leemos al usuario actual del AccountStore / localStorage
        const current = this.accountStore.getCurrentUser();
        if (current) {
            this.profile.set({
                ...this.profile(),
                name: (current as any).fullName ?? (current as any).name ?? '',
                email: (current as any).email ?? '',
            });
        }
    }

    setProfile<K extends keyof Profile>(k: K, v: Profile[K]) {
        this.profile.set({ ...this.profile(), [k]: v });
        this.markDirty();
    }
    saveProfile(){ alert('Profile saved (frontend mock)'); }

    // Preferences
    prefs = signal<Prefs>({
        language: 'en',
        timezone: 'America/Lima',
        units: 'metric',
        dateFormat: 'DD/MM/YYYY',
        weekStartsOn: 'mon',
    });
    languages = ['en','es','pt','fr'];
    timezones = ['America/Lima','America/Mexico_City','America/Bogota','UTC'];
    setPrefs<K extends keyof Prefs>(k: K, v: Prefs[K]) {
        this.prefs.set({ ...this.prefs(), [k]: v });
        this.markDirty();
    }

    // NOTE: también guarda preferencias granulares (US24)
    savePrefs(){
        localStorage.setItem('fs.notify.prefs', JSON.stringify(this.notifyPrefs));
        alert('Preferences saved (frontend mock)');
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
    applyTheme(){ alert('Theme applied (frontend mock)'); }

    // Notifications (básicas)
    notif = signal<Notif>({
        email: true,
        push: false,
        weeklyReport: true,
        criticalOnly: true,
        ethyleneThreshold: 0.5,
        tempThreshold: 6,
    });
    setNotif<K extends keyof Notif>(k: K, v: Notif[K]) {
        this.notif.set({ ...this.notif(), [k]: v });
        this.markDirty();
    }
    resetNotif(){
        this.notif.set({ email:true, push:false, weeklyReport:true, criticalOnly:true, ethyleneThreshold:0.5, tempThreshold:6 });
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
        if (!('Notification' in window)) { alert('Notifications API not available'); return; }
        if (Notification.permission === 'default') await Notification.requestPermission();
        if (Notification.permission === 'granted') {
            new Notification('FreshSense', { body: 'Test notification ✅' });
        }
    }

    // Security
    twoFA = signal(false);
    sessions = signal<SessionInfo[]>([
        { device: 'Windows • Chrome', ip: '181.65.12.34', lastActive: 'Now', current: true },
        { device: 'iPhone • Mobile App', ip: '177.34.8.10', lastActive: '2d ago' },
        { device: 'MacOS • Safari', ip: '201.22.44.9', lastActive: '1w ago' },
    ]);
    changePassword(){ alert('Change password (frontend mock)'); }
    toggle2FA(){ this.twoFA.set(!this.twoFA()); }
    revokeSession(i: number){
        const arr = this.sessions().slice();
        const [s] = arr.splice(i,1);
        alert(`Session revoked: ${s.device}`);
        this.sessions.set(arr);
    }

    // Integrations
    integrations = signal<Integration[]>([
        { key:'google',   name:'Google',   connected:false, note:'Calendar & Drive export' },
        { key:'slack',    name:'Slack',    connected:true,  note:'#freshsense channel' },
        { key:'zapier',   name:'Zapier',   connected:false },
        { key:'webhooks', name:'Webhooks', connected:true,  note:'2 active hooks' },
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
        // guarda también las prefs granulares
        localStorage.setItem('fs.notify.prefs', JSON.stringify(this.notifyPrefs));
        this.dirty.set(false);
        alert('Settings saved (frontend mock)');
    }
}
