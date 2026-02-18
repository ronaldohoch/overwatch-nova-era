import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { USER_ROLES, isUserRole, type UserRole } from './user-role';

export type RouteAccess = 'public' | UserRole | readonly UserRole[];

type RouteDataWithAccess = Readonly<{
  access?: RouteAccess;
}>;

const DEFAULT_ACCESS: RouteAccess = 'public';
const HOME_PATH = '/';
const LOGIN_PATH = '/login';

export const routeAccessGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const auth = inject(AuthService);
  const router = inject(Router);
  const access = readAccess(route);
  const browser = isPlatformBrowser(platformId);

  // During SSR/prerender we do not have client storage/session context.
  if (!browser) {
    return true;
  }

  if (access === 'public') {
    return true;
  }

  const authenticated = auth.isAuthenticated();
  if (!authenticated) {
    return router.createUrlTree([LOGIN_PATH], {
      queryParams: { redirect: state.url },
    });
  }

  const role = auth.userRole();
  if (!role) {
    auth.logout();
    return router.createUrlTree([LOGIN_PATH], {
      queryParams: { redirect: state.url },
    });
  }

  const allowedRoles = Array.isArray(access) ? access : [access];

  return allowedRoles.includes(role) ? true : router.createUrlTree([HOME_PATH]);
};

function readAccess(route: ActivatedRouteSnapshot): RouteAccess {
  const raw = (route.data as RouteDataWithAccess | undefined)?.access;
  if (!raw) return DEFAULT_ACCESS;
  if (raw === 'public' || isUserRole(raw)) return raw;

  if (!Array.isArray(raw)) return DEFAULT_ACCESS;

  const roles = raw.filter(isUserRole);
  return roles.length ? roles : USER_ROLES;
}
