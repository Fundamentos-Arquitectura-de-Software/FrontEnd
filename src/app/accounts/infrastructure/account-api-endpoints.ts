// Dominio del backend
const BACKEND_BASE =
    window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://1asi0729-2520-7357-g4-senseeat-backend-freshsens-production.up.railway.app';

// Endpoint base para cuentas
const API_BASE = `${BACKEND_BASE}/api/accounts`;

export const AccountApiEndpoints = {
    register: `${API_BASE}/register`,
    login: `${API_BASE}/login`,
};
