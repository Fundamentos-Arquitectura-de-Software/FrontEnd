import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // All API requests are sent with credentials so the HttpOnly authToken cookie is included
    const authReq = req.clone({ withCredentials: true });
    return next(authReq);
};
