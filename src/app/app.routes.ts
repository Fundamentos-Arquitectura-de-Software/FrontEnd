import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/presentation/components/layout/layout';
import { authGuard } from './shared/infrastructure/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'register', pathMatch: 'full' },

    {
        path: 'register',
        loadComponent: () =>
            import('./accounts/presentation/views/register/register.component')
                .then(m => m.RegisterView),
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./accounts/presentation/views/login/login.component')
                .then(m => m.LoginView),
    },
    {
        path: 'plan',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./billing/presentation/views/plan/plan.component')
                .then(m => m.PlanView),
    },
    {
        path: 'payment',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./billing/presentation/views/payment/payment.component')
                .then(m => m.PaymentView),
    },
    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./shared/presentation/view/home/home.view')
                        .then(m => m.HomeView),
            },
            {
                path: 'inventory',
                loadChildren: () =>
                    import('./inventory/presentation/view/inventory.routes')
                        .then(m => m.INVENTORY_ROUTES),
            },
            {
                path: 'monitoring',
                loadComponent: () =>
                    import('./monitoring/presentation/monitoring.view')
                        .then(m => m.MonitoringView),
            },
            {
                path: 'alerts',
                loadComponent: () =>
                    import('./alerts/presentation/alerts.view')
                        .then(m => m.AlertsView),
            },
            {
                path: 'recipes',
                loadComponent: () =>
                    import('./recipes/presentation/recipes.view')
                        .then(m => m.RecipesView),
            },
            {
                path: 'reports',
                loadComponent: () =>
                    import('./reports/presentation/reports.view')
                        .then(m => m.ReportsView),
            },
            {
                path: 'achievements',
                loadComponent: () =>
                    import('./achievements/presentation/achievements.view')
                        .then(m => m.AchievementsView),
            },
            {
                path: 'challenges',
                loadComponent: () =>
                    import('./challenges/presentation/challenges.view')
                        .then(m => m.ChallengesView),
            },
            {
                path: 'settings',
                loadComponent: () =>
                    import('./accounts/presentation/views/settings/settings.view')
                        .then(m => m.SettingsView),
            },
            { path: '', redirectTo: 'inventory', pathMatch: 'full' },
        ],
    },
    {
        path: '**',
        loadComponent: () =>
            import('./shared/presentation/view/page-not-found/page-not-found.view')
                .then(m => m.PageNotFoundView),
    },
];
