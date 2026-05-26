import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
    selector: 'fs-layout',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslateModule, ToastComponent],
    templateUrl: './layout.html',
    styleUrls: ['./layout.css'],
})
export class LayoutComponent {
    constructor(public lang: LanguageService) {}
    curr() { return this.lang.current(); }
    toggleLang() { this.lang.toggle(); }
    setLang(l: 'en'|'es') { this.lang.use(l); }
}
