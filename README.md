# FreshSense - Frontend

Aplicacion web de FreshSense construida con Angular 20. Permite gestionar inventario de alimentos, visualizar alertas, recetas, monitoreo de sensores IoT, logros y desafios.

---

## Requisitos

| Herramienta | Version minima |
|-------------|----------------|
| Node.js     | 20+            |
| npm         | 10+            |

---

## Prerequisito: Backend corriendo

El frontend depende del backend. Antes de levantar el frontend, el backend debe estar completamente operativo con sus cuatro servicios:

| Servicio | Puerto |
|----------|--------|
| Eureka Server | 8761 |
| Alerts Service | 8083 |
| Recipes Service | 8082 |
| Monolito principal | 8080 |

Ver el README del backend para instrucciones de setup y orden de arranque.

---

## Instalacion y ejecucion

```bash
cd "FrontEnd-FreshSense-main/FrontEnd-FreshSense-main"
npm install
npm start
```

La aplicacion levanta en `http://localhost:4200`.

---

## Comandos disponibles

```bash
npm start        # Servidor de desarrollo (puerto 4200, hot reload)
npm run build    # Build de produccion (output en dist/)
npm test         # Tests unitarios con Karma
```

---

## Configuracion de entorno

El archivo `src/environments/environment.ts` contiene la URL base del API para desarrollo local:

```typescript
export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:8080/api'
};
```

Para produccion, editar `src/environments/environment.production.ts` con la URL real del backend desplegado. Este archivo **no debe tener URLs hardcodeadas en el repositorio** — debe configurarse en el proceso de CI/CD o build de produccion.

---

## Arquitectura

El proyecto sigue Domain-Driven Design (DDD) con componentes standalone de Angular 20.

```
src/app/
├── accounts/          # Autenticacion, registro, configuracion de usuario
├── achievements/      # Logros y gamificacion
├── alerts/            # Alertas por vencimiento o stock bajo
├── billing/           # Planes y suscripciones
├── challenges/        # Retos y leaderboard
├── inventory/         # Gestion de productos en inventario
├── monitoring/        # Monitoreo de sensores IoT
├── notifications/     # Bandeja de notificaciones in-app
├── recipes/           # Recetas personalizadas
├── reports/           # Historial de consumo y reportes
└── shared/            # Componentes comunes, guards, layout, home
```

Estructura interna de cada modulo:

```
{modulo}/
├── domain/             # Modelos de dominio (interfaces/types)
├── application/        # Stores con signals, facades, servicios de aplicacion
├── infrastructure/     # Servicios HTTP hacia el backend
└── presentation/       # Componentes Angular (views)
```

---

## Autenticacion

- El token JWT viaja en cookie HttpOnly `authToken` seteada por el backend — el frontend nunca lo almacena en localStorage.
- Todas las peticiones usan `withCredentials: true` via `auth.interceptor.ts`.
- El `authGuard` llama a `tryRestoreSession()` antes de redirigir, permitiendo recuperar sesiones activas al recargar la pagina.
- Login con Google: el boton redirige a `{apiBaseUrl}/oauth2/authorization/google`. Requiere que el backend tenga configuradas las credenciales de Google OAuth2.

### Roles disponibles

| Rol            | Descripcion                                          |
|----------------|------------------------------------------------------|
| `USER_STANDARD`| Usuario registrado sin suscripcion activa            |
| `USER_PREMIUM` | Usuario con suscripcion; accede a recetas premium    |
| `ADMIN`        | Administrador del sistema                            |

---

## Rutas

| Ruta              | Componente             | Acceso   |
|-------------------|------------------------|----------|
| `/login`          | LoginView              | Publico  |
| `/register`       | RegisterView           | Publico  |
| `/dashboard`      | HomeView               | Auth     |
| `/inventory`      | InventoryView (lazy)   | Auth     |
| `/monitoring`     | MonitoringView         | Auth     |
| `/alerts`         | AlertsView             | Auth     |
| `/recipes`        | RecipesView            | Auth     |
| `/reports`        | ReportsView            | Auth     |
| `/achievements`   | AchievementsView       | Auth     |
| `/challenges`     | ChallengesView         | Auth     |
| `/notifications`  | NotificationsView      | Auth     |
| `/settings`       | SettingsView           | Auth     |
| `/plan`           | PlanView               | Auth     |
| `/payment`        | PaymentView            | Auth     |

---

## Internacionalizacion (i18n)

Los archivos de traduccion estan en `public/i18n/`:

- `es.json` — Espanol (idioma por defecto)
- `en.json` — Ingles

Se usa `@ngx-translate/core`. El idioma se cambia con el toggle EN/ES del topbar.

**Convencion:** no se permiten strings hardcodeados en los componentes. Todos los textos visibles al usuario deben usar claves de traduccion con `| translate` o `TranslateService.instant()`.

---

## Convenciones de desarrollo

- Componentes standalone (sin NgModules).
- Signals de Angular para estado reactivo local.
- `inject()` en servicios y stores en lugar de constructor injection.
- Prettier: comillas simples, `printWidth: 100`.
- Prefijo `fs-` en todos los selectores CSS de componentes.
- Sufijo `View` en todas las clases de componentes de vista.
- `takeUntilDestroyed()` en todas las suscripciones para evitar memory leaks.

---

## Estado de funcionalidades

| Feature                        | Estado    |
|-------------------------------|-----------|
| Login / Registro JWT           | Completo  |
| Login con Google (OAuth2)      | Completo  |
| Inventario (CRUD)              | Completo  |
| Voz para agregar productos     | Completo  |
| Alertas con filtros            | Completo  |
| Monitoreo de sensores          | Completo  |
| Recetas con filtros            | Completo  |
| Recetas premium (RBAC)         | Completo  |
| Reportes e historial           | Completo  |
| Logros (achievements)          | Completo  |
| Desafios (challenges)          | Completo  |
| Bandeja de notificaciones      | Completo  |
| Configuracion de usuario       | Completo  |
| Restriccion UI por rol premium | Pendiente |
| Tutorial interactivo (US15)    | Pendiente |
| Reporte impacto ambiental CO2  | Pendiente |
| Sugerencias de compra          | Pendiente |
