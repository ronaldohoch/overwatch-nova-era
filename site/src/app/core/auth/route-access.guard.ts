import { inject } from '@angular/core';
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
  const auth = inject(AuthService);
  const router = inject(Router);
  const access = readAccess(route);
  const authenticated = auth.isAuthenticated();

  if (access === 'public') {
    return true;
  }

  if (!authenticated) {
    return router.createUrlTree([LOGIN_PATH], {
      queryParams: { redirect: state.url },
    });
  }

  const role = auth.userRole();
  const allowedRoles = Array.isArray(access) ? access : [access];

  return role && allowedRoles.includes(role) ? true : router.createUrlTree([HOME_PATH]);
};

function readAccess(route: ActivatedRouteSnapshot): RouteAccess {
  const raw = (route.data as RouteDataWithAccess | undefined)?.access;
  if (!raw) return DEFAULT_ACCESS;
  if (raw === 'public' || isUserRole(raw)) return raw;

  if (!Array.isArray(raw)) return DEFAULT_ACCESS;

  const roles = raw.filter(isUserRole);
  return roles.length ? roles : USER_ROLES;
}
