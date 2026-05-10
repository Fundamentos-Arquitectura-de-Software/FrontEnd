import { Component, computed, signal } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

type Category = 'Environment' | 'Quality' | 'Safety';

interface MetricCard {
    id: string;
    kind: 'metric' | 'progress';
    title: string;
    value?: string;
    valuePct?: number;
    subtitle?: string;
    category: Category;
    unit?: string;
    trend?: number[];
    warnAbove?: number;
    critAbove?: number;
}

@Component({
    selector: 'fs-monitoring-view',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, TranslateModule], // ⬅️ agregado
    templateUrl: './monitoring.view.html',
    styleUrls: ['./monitoring.view.css'],
})
export class MonitoringView {
    lastMonitoringDate = '10/07/2025';
    lastSync = '2 min ago';
    // si tu HTML usa {{ 'monitoring.lastSync' | translate:{ minutes: lastSyncMinutes } }}
    get lastSyncMinutes() { return 2; }

    categories: (Category | 'All')[] = ['All', 'Environment', 'Quality', 'Safety'];
    activeCategory = signal<Category | 'All'>('All');

    private allCards = signal<MetricCard[]>([
        { id:'hum', kind:'metric',   title:'Humidity Sensor',  value:'55', unit:'%', category:'Environment', trend:[62,60,58,57,56,55,55] },
        { id:'rip', kind:'progress', title:'Ripeness',         valuePct:40, category:'Quality', trend:[20,24,28,34,40,38,40] },
        { id:'temp',kind:'metric',   title:'Temperature',      value:'5.5', unit:'°C', subtitle:'Weekly 5.0°C', category:'Environment', trend:[4.8,5.1,5.3,5.9,5.5,5.6,5.5], warnAbove:6, critAbove:8 },
        { id:'eth', kind:'metric',   title:'Ethylene Level',   value:'0.6', unit:'ppm', category:'Quality', trend:[0.3,0.35,0.34,0.38,0.42,0.55,0.6], warnAbove:0.5, critAbove:1 },
        { id:'o2',  kind:'metric',   title:'Oxygen',           value:'21', unit:'%', category:'Environment', trend:[20.8,21.0,21.1,21.0,20.9,21.0,21.0] },
        { id:'clean',kind:'metric',  title:'Cleanliness Levels', value:'86', unit:'%', category:'Safety', trend:[82,84,83,85,86,86,86] },
    ]);

    readonly kpi = {
        issues: computed(() =>
            this.allCards().filter(c =>
                (c.id === 'temp' && Number(c.value) >= (c.warnAbove ?? Infinity)) ||
                (c.id === 'eth'  && Number(c.value) >= (c.warnAbove ?? Infinity))
            ).length
        ),
        avgHumidity: computed(() => 57),
        avgTemp: computed(() => 5.3),
    };

    cards = computed(() => {
        const cat = this.activeCategory();
        return cat === 'All' ? this.allCards() : this.allCards().filter(c => c.category === cat);
    });

    badgeClass(card: MetricCard): 'ok' | 'warn' | 'crit' {
        if (card.value === undefined) return 'ok';
        const v = Number(card.value);
        if (card.critAbove !== undefined && v >= card.critAbove) return 'crit';
        if (card.warnAbove !== undefined && v >= card.warnAbove) return 'warn';
        return 'ok';
    }

    sparkPoints(arr: number[] = [], w = 120, h = 36) {
        if (!arr.length) return '';
        const pad = 2, min = Math.min(...arr), max = Math.max(...arr);
        const x = (i: number) => pad + i * ((w - pad * 2) / (arr.length - 1));
        const y = (val: number) => h - pad - (arr.length > 1 ? ((val - min) / (max - min || 1)) * (h - pad * 2) : 0);
        return arr.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    }

    setCategory(c: Category | 'All') { this.activeCategory.set(c); }
}
