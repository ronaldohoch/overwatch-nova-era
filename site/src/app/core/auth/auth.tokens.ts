import { InjectionToken } from '@angular/core';

export const AUTH_API_BASE_URL = new InjectionToken<string>('AUTH_API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/auth',
});

export const AUTH_STORAGE_KEY = 'ow.auth.session';
