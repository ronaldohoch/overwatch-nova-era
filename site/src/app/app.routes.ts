import { Routes } from '@angular/router';
import { routeAccessGuard } from './core/auth/route-access.guard';
import { USER_ROLES } from './core/auth/user-role';

export const routes: Routes = [
  {
    path: '',
    title: 'Copa Overwatch - Nova Era',
    loadComponent: () => import('./features/pagina-inicial/pagina-inicial').then(m=>m.PaginaInicial)
  },
  {
    path: 'duvidas-frequentes',
    title: 'Copa Overwatch - Dúvidas frequêntes',
    loadComponent: () => import('./features/faq/faq.component').then(m=>m.FaqComponent)
  },
  {
    path: 'regras',
    title: 'Copa Overwatch - Regras',
    loadComponent: () => import('./features/regras/regras.component').then(m=>m.RegrasComponent)
  },
  {
    path: 'torneio',
    title: 'Copa Overwatch - Chaveamento',
    canActivate: [routeAccessGuard],
    data: {
      access: USER_ROLES,
    },
    loadComponent: () => import('./features/torneio/torneio.component').then(m=>m.TorneioComponent)
  },
  {
    path: 'watchpoint',
    title: 'Copa Overwatch - Watchpoint',
    canActivate: [routeAccessGuard],
    data: {
      access: USER_ROLES,
    },
    loadComponent: () => import('./features/watchpoint/watchpoint.component').then(m=>m.WatchpointComponent)
  },
  {
    path: 'login',
    title: 'Copa Overwatch - Login',
    loadComponent: () => import('./features/login/login.component').then(m=>m.LoginComponent)
  },
];
