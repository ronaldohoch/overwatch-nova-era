import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

const AUTH_ENDPOINT_PATTERN = /\/(login|signup|forgot-password|reset-password)(\?|$)/;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).token();

  if (!token || request.headers.has('Authorization') || AUTH_ENDPOINT_PATTERN.test(request.url)) {
    return next(request);
  }

  const requestWithAuth = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(requestWithAuth);
};
