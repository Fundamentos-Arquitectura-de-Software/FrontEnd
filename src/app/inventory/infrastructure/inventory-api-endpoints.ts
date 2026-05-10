const BACKEND_BASE =
    window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://1asi0729-2520-7357-g4-senseeat-backend-freshsens-production.up.railway.app';


const API_BASE = `${BACKEND_BASE}/api/products`;

export const InventoryApiEndpoints = {
    base: API_BASE,
};
