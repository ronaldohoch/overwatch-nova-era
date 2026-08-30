import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { routeAccessGuard } from './core/auth/route-access.guard';
import { USER_ROLES } from './core/auth/user-role';

export const routes: Routes = [
  {
    path: '',
    title: 'STG Esports - Conectando comunidades através dos esports',
    loadComponent: () =>
      import('./features/pagina-inicial/pagina-inicial.component').then(
        (m) => m.PaginaInicialComponent,
      ),
  },
  {
    path: 'quem-e-nova-era',
    title: 'Copa Overwatch Nova Era - Quem é Nova Era?',
    loadComponent: () =>
      import('./features/quem-e-nova-era/quem-e-nova-era.component').then(
        (m) => m.QuemENovaEraComponent,
      ),
  },
  {
    // Como Funciona virou aba de "Quem e Nova Era?"; a rota antiga continua valendo como atalho.
    path: 'como-funciona',
    redirectTo: () => inject(Router).parseUrl('/quem-e-nova-era?tab=como-funciona'),
  },
  {
    path: 'duvidas-frequentes',
    title: 'Copa Overwatch Nova Era - Dúvidas frequentes',
    loadComponent: () => import('./features/faq/faq.component').then(m=>m.FaqComponent)
  },
  {
    path: 'regras-stg',
    title: 'STG Overwatch Open - Regulamento',
    loadComponent: () =>
      import('./features/regras-stg/regras-stg.component').then((m) => m.RegrasStgComponent),
  },
  {
    // Regras virou aba de "Quem e Nova Era?"; a rota antiga continua valendo como atalho.
    path: 'regras',
    redirectTo: () => inject(Router).parseUrl('/quem-e-nova-era?tab=regras'),
  },
  {
    path: 'torneio',
    title: 'Copa Overwatch Nova Era - Chaveamento',
    loadComponent: () => import('./features/torneio/torneio.component').then(m=>m.TorneioComponent)
  },
  {
    path: 'torneios/:id',
    title: 'Copa Overwatch Nova Era - Torneio',
    loadComponent: () =>
      import('./features/torneio/torneio-detalhe/torneio-detalhe.component').then(
        (m) => m.TorneioDetalheComponent,
      ),
  },
  {
    path: 'watchpoint',
    title: 'Copa Overwatch Nova Era - Watchpoint',
    canActivate: [routeAccessGuard],
    data: {
      access: USER_ROLES,
    },
    // loadComponent: () => import('./features/watchpoint/watchpoint.component').then(m=>m.WatchpointComponent)
    loadChildren: ()=> import('./features/watchpoint/routes')
  },
  {
    path: 'login',
    title: 'Copa Overwatch Nova Era - Login',
    loadComponent: () => import('./features/login/login.component').then(m=>m.LoginComponent)
  },
  {
    path: 'reset-password',
    title: 'Copa Overwatch Nova Era - Redefinir senha',
    loadComponent: () =>
      import('./features/login/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'design-system',
    title: 'Copa Overwatch Nova Era - Design System',
    loadComponent: () =>
      import('./features/design-system/design-system.component').then(
        (m) => m.DesignSystemComponent,
      ),
  },
];
