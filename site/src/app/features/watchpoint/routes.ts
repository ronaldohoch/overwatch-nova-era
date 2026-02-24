import { Routes } from '@angular/router';
import { routeAccessGuard } from '../../core/auth/route-access.guard';
import { USER_ROLES } from '../../core/auth/user-role';

export default [
  {
    path: '',
    title: 'Copa Overwatch Nova Era - Watchpoint',
    loadComponent: () => import('./watchpoint.component').then(m => m.WatchpointComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        title: 'Copa Overwatch Nova Era - Dashboard',
        loadComponent: () => import('./paginas/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'dados-do-usuario',
        title: 'Copa Overwatch Nova Era - Dados de usuário',
        loadComponent: () => import('./paginas/meus-dados/meus-dados.component').then((m) => m.MeusDadosComponent),
      },
      {
        path: 'novo-torneio',
        title: 'Copa Overwatch Nova Era - Novo Torneio',
        canActivate: [routeAccessGuard],
        data: {
          access: 'admin',
        },
        loadComponent: () => import('./paginas/torneios/torneios.component').then((m) => m.TorneiosComponent),
      },
      {
        path: 'torneios/:id/editar',
        title: 'Copa Overwatch Nova Era - Editar Torneio',
        canActivate: [routeAccessGuard],
        data: {
          access: 'admin',
        },
        loadComponent: () => import('./paginas/torneios/torneios.component').then((m) => m.TorneiosComponent),
      },
      {
        path: 'torneios/:id/status',
        title: 'Copa Overwatch Nova Era - Alterar Status de Torneio',
        canActivate: [routeAccessGuard],
        data: {
          access: 'admin',
        },
        loadComponent: () =>
          import('./paginas/torneios-status/torneios-status.component').then(
            (m) => m.TorneiosStatusComponent,
          ),
      },
      {
        path: 'torneios',
        title: 'Copa Overwatch Nova Era - Torneios',
        loadComponent: () => import('./paginas/listagem-torneios/listagem-torneios.component').then((m) => m.ListagemTorneiosComponent),
      },
      {
        path: 'check-ins',
        title: 'Copa Overwatch Nova Era - Check-ins',
        loadComponent: () =>
          import('./paginas/check-ins/check-ins.component').then((m) => m.CheckInsComponent),
      },
      {
        path: 'check-in-by-tournament',
        title: 'Copa Overwatch Nova Era - Check-ins por Torneio',
        canActivate: [routeAccessGuard],
        data: {
          access: ['streamer', 'admin'],
        },
        loadComponent: () =>
          import('./paginas/check-in-by-tournament/check-in-by-tournament.component').then(
            (m) => m.CheckInByTournamentComponent,
          ),
      },
      {
        path: 'ferramentas-de-streamer',
        title: 'Copa Overwatch Nova Era - Ferramentas de streamer',
        canActivate: [routeAccessGuard],
        data: {
          access: ['streamer', 'admin'],
        },
        loadComponent: () => import('./paginas/ferramentas-de-streamer/ferramentas-de-streamer.component').then((m) => m.FerramentasDeStreamerComponent),
      },
      {
        path: 'ferramentas-de-streamer/roleta',
        title: 'Copa Overwatch Nova Era - Ferramentas de streamer',
        canActivate: [routeAccessGuard],
        data: {
          access: ['streamer', 'admin'],
        },
        loadComponent: () => import('./paginas/ferramentas-de-streamer/paginas/roleta/roleta.component').then((m) => m.RoletaComponent),
      },
      {
        path: 'usuarios',
        title: 'Copa Overwatch Nova Era - Usuarios',
        canActivate: [routeAccessGuard],
        data: {
          access: 'admin',
        },
        loadComponent: () =>
          import('./paginas/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'trofeus',
        title: 'Copa Overwatch Nova Era - Trofeus',
        canActivate: [routeAccessGuard],
        data: {
          access: ['admin', 'streamer'],
        },
        loadComponent: () =>
          import('./paginas/trofeus/trofeus.component').then((m) => m.TrofeusComponent),
      },
      {
        path: 'trofeus/time/:teamId',
        title: 'Copa Overwatch Nova Era - Trofeus',
        canActivate: [routeAccessGuard],
        data: {
          access: ['admin', 'streamer'],
        },
        loadComponent: () =>
          import('./paginas/trofeus/trofeus.component').then((m) => m.TrofeusComponent),
      },
      {
        path: 'times',
        title: 'Copa Overwatch Nova Era - Times',
        canActivate: [routeAccessGuard],
        data: {
          access: USER_ROLES,
        },
        loadComponent: () => import('./paginas/times-listagem/times-listagem.component').then((m) => m.TimesListagemComponent),
      },
      {
        path: 'novo-time',
        title: 'Copa Overwatch Nova Era - Times cadastro',
        canActivate: [routeAccessGuard],
        data: {
          access: USER_ROLES,
        },
        loadComponent: () => import('./paginas/times-cadastro/times-cadastro.component').then((m) => m.TimesCadastroComponent),
      },
      {
        path: 'time/:id/detalhe',
        title: 'Copa Overwatch Nova Era - Detalhe do time',
        canActivate: [routeAccessGuard],
        data: {
          access: USER_ROLES,
        },
        loadComponent: () => import('./paginas/times-detalhe/times-detalhe.component').then((m) => m.TimesDetalheComponent),
      },
    ]
  },
] as Routes;
