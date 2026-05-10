import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './shared/infrastructure/auth.interceptor';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
        provideTranslateService({
            loader: provideTranslateHttpLoader({ prefix: 'i18n/', suffix: '.json' }),
            fallbackLang: 'en',
        }),
        provideRouter(routes),
    ],
};
