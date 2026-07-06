import { environment } from '../../../environments/environment';

export const AccountApiEndpoints = {
    register: `${environment.apiBaseUrl}/accounts/register`,
    login: `${environment.apiBaseUrl}/accounts/login`,
    logout: `${environment.apiBaseUrl}/accounts/logout`,
    refresh: `${environment.apiBaseUrl}/accounts/refresh`,
    me: `${environment.apiBaseUrl}/accounts/me`,
    changePassword: `${environment.apiBaseUrl}/accounts/change-password`,
};
