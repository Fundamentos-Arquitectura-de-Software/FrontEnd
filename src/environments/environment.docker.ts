// Build para despliegue tras Nginx: la SPA llama al backend por el mismo origen (/api),
// y Nginx hace de reverse proxy hacia el backend.
export const environment = {
    production: true,
    apiBaseUrl: '/api'
};
