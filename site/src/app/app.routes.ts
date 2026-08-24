import { Routes } from '@angular/router';
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
    path: 'como-funciona',
    title: 'Copa Overwatch Nova Era - Como Funciona',
    loadComponent: () => import('./features/como-funciona/como-funciona.component').then(m => m.ComoFuncionaComponent)
  },
  {
    path: 'duvidas-frequentes',
    title: 'Copa Overwatch Nova Era - Dúvidas frequentes',
    loadComponent: () => import('./features/faq/faq.component').then(m=>m.FaqComponent)
  },
  {
    path: 'regras',
    title: 'Copa Overwatch Nova Era - Regras',
    loadComponent: () => import('./features/regras/regras.component').then(m=>m.RegrasComponent)
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
