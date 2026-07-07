import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InventoryApi } from '../../../infrastructure/inventory-api';
import { CatalogItem } from '../../../domain/catalog-item.model';
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
export class InventoryAddComponent implements OnInit {
    product = { name: '', description: '', category: '', quantity: 0, imageUrl: '', expirationDate: '' };
    // Las 7 categorías de umbrales del Edge: cualquier otra no tendría semáforo de frescura.
    categories = ['Frutas', 'Verduras', 'Lácteos', 'Carnes', 'Proteínas', 'Panadería', 'Snacks'];

    // Catálogo general: elegir de la lista precarga el formulario (opción manual como respaldo).
    mode: 'catalog' | 'manual' = 'catalog';
    catalog: CatalogItem[] = [];
    catalogLoading = true;
    catalogSearch = '';
    catalogCategory = 'All';
    pickedFrom = '';

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

    ngOnInit(): void {
        this.inventoryApi.getCatalog().subscribe({
            next: (items) => { this.catalog = items ?? []; this.catalogLoading = false; },
            error: () => { this.catalog = []; this.catalogLoading = false; this.mode = 'manual'; },
        });
    }

    get filteredCatalog(): CatalogItem[] {
        const term = this.normalize(this.catalogSearch.trim());
        return this.catalog.filter((i) => {
            const matchesTerm = !term || this.normalize(i.name).includes(term);
            const matchesCat = this.catalogCategory === 'All' || i.category === this.catalogCategory;
            return matchesTerm && matchesCat;
        });
    }

    pick(item: CatalogItem): void {
        this.product = {
            name: item.name,
            description: item.description ?? '',
            category: item.category,
            quantity: 1,
            imageUrl: item.imageUrl ?? '',
            expirationDate: '',
        };
        this.pickedFrom = item.name;
        this.mode = 'manual';
    }

    setMode(mode: 'catalog' | 'manual'): void {
        this.mode = mode;
        if (mode === 'catalog') this.pickedFrom = '';
    }

    onCatalogImgError(event: Event): void {
        const img = event.target as HTMLImageElement | null;
        if (img) img.style.display = 'none';
    }

    private normalize(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '');
    }

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
        const catMap: Record<string, string> = { fruta:'Frutas',frutas:'Frutas',fruit:'Frutas',vegetal:'Verduras',verdura:'Verduras',verduras:'Verduras',vegetable:'Verduras','lácteos':'Lácteos',lacteos:'Lácteos',yogurt:'Lácteos',queso:'Lácteos',leche:'Lácteos',carne:'Carnes',pollo:'Carnes',res:'Carnes',pavo:'Carnes',pescado:'Carnes',huevo:'Proteínas',huevos:'Proteínas',pan:'Panadería','panadería':'Panadería',panaderia:'Panadería',snack:'Snacks',snacks:'Snacks' };
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
        if (!this.product.name || !this.product.category || !this.product.expirationDate) {
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
