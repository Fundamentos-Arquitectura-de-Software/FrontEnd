import { User } from '../domain/model/user.entity';
import { AuthResponse } from './account-response';

export class AccountAssembler {
    static fromResponse(response: AuthResponse): User {
        return {
            name: response.fullName || '',
            email: response.email || '',
            password: '', // no viene del backend, lo dejamos vacío
        };
    }
}
