import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryApi } from '../../../infrastructure/inventory-api';
import { ToastService } from '../../../../shared/application/toast.service';

declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: ((event: any) => void) | null;
}

type PartialProduct = { name?: string; quantity?: number; category?: string; };

@Component({
    selector: 'app-inventory-form',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule],
    templateUrl: './inventory-form.html',
    styleUrls: ['./inventory-form.css'],
})
export class InventoryAddComponent {
    product = { name: '', description: '', category: '', quantity: 0, imageUrl: '' };
    categories = ['Fruit', 'Vegetable', 'Dairy', 'Grain', 'Meat', 'Snack'];

    private recognition?: SpeechRecognition;
    recording = false;
    voiceHint = '';

    constructor(
        private inventoryApi: InventoryApi,
        private router: Router,
        public route: ActivatedRoute,
        private toast: ToastService,
        private translate: TranslateService
    ) {}

    private ensureRecognition() {
        if (this.recognition) return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { this.voiceHint = this.translate.instant('inventory.form.speechNotSupported'); return; }
        this.recognition = new SR();
        this.recognition!.lang = 'es-PE';
        this.recognition!.interimResults = false;
        this.recognition!.maxAlternatives = 1;
        this.recognition!.onresult = (ev: any) => {
            const transcript: string = ev.results[0][0].transcript || '';
            this.voiceHint = `"${transcript}"`;
            this.applyVoice(this.parseVoiceCommand(transcript));
        };
        this.recognition!.onerror = () => { this.voiceHint = this.translate.instant('inventory.form.speechError'); this.recording = false; };
        this.recognition!.onend = () => (this.recording = false);
    }

    startVoice() { this.ensureRecognition(); if (!this.recognition) return; this.voiceHint = this.translate.instant('inventory.form.listening'); this.recording = true; this.recognition.start(); }
    stopVoice()  { if (!this.recognition) return; this.recognition.stop(); this.recording = false; }

    private parseVoiceCommand(text: string): PartialProduct {
        const t = text.toLowerCase().trim();
        const numbers: Record<string, number> = { uno:1,una:1,un:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10 };
        let qty = 0;
        const mNum = t.match(/\b(\d+)\b/);
        if (mNum) qty = parseInt(mNum[1], 10);
        else { const found = Object.entries(numbers).find(([w]) => t.includes(w)); if (found) qty = found[1]; }
        const catMap: Record<string, string> = { fruta:'Fruit',frutas:'Fruit',fruit:'Fruit',vegetal:'Vegetable',verdura:'Vegetable',vegetable:'Vegetable','lácteos':'Dairy',lacteos:'Dairy',yogurt:'Dairy',queso:'Dairy',carne:'Meat',pollo:'Meat',res:'Meat',pavo:'Meat',grano:'Grain',arroz:'Grain',pan:'Grain',cereal:'Grain',snack:'Snack' };
        let category: string | undefined;
        for (const k of Object.keys(catMap)) { if (t.includes(k)) { category = catMap[k]; break; } }
        let name = t.replace(/\b(\d+|uno|una|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/g,'').replace(/\b(fruta|frutas|fruit|vegetal|verdura|vegetable|lácteos|lacteos|carne|grano|snack|category)\b/g,'').trim();
        if (!name) { const parts = t.split(/\s+/); name = parts[parts.length - 1] || ''; }
        return { name, quantity: qty || undefined, category };
    }

    private applyVoice(pp: PartialProduct) {
        if (pp.name) this.product.name = this.toTitle(pp.name);
        if (typeof pp.quantity === 'number') this.product.quantity = pp.quantity;
        if (pp.category) this.product.category = pp.category;
    }

    private toTitle(s: string) { return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1)); }

    onSubmit() {
        if (!this.product.name || !this.product.category) {
            this.toast.error(this.translate.instant('inventory.form.requiredFields'));
            return;
        }
        this.inventoryApi.createProduct(this.product).subscribe({
            next: () => { this.toast.success(this.translate.instant('inventory.form.addSuccess')); this.router.navigate(['/inventory']); },
            error: () => { this.toast.error(this.translate.instant('inventory.form.addError')); },
        });
    }

    cancel() { this.router.navigate(['/inventory']); }
}
