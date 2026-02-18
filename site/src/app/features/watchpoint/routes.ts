import { Routes } from "@angular/router";

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
        loadComponent: () => import('./paginas/torneios/torneios.component').then((m) => m.TorneiosComponent),
      },
      {
        path: 'torneios',
        title: 'Copa Overwatch Nova Era - Torneios',
        loadComponent: () => import('./paginas/listagem-torneios/listagem-torneios.component').then((m) => m.ListagemTorneiosComponent),
      },
    ]
  },
] as Routes;
