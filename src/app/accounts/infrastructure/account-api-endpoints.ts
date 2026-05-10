import { environment } from '../../../environments/environment';

export const AccountApiEndpoints = {
    register: `${environment.apiBaseUrl}/accounts/register`,
    login: `${environment.apiBaseUrl}/accounts/login`,
};
