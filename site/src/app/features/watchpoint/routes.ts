import { Routes } from "@angular/router";

export default [
  {
    path: '',
    title: 'Imperium LARP - Cartulário',
    loadComponent: () => import('./watchpoint.component').then(m => m.WatchpointComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        title: 'Imperium LARP - Dashboard',
        loadComponent: () => import('./paginas/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'dados-do-usuario',
        title: 'Imperium LARP - Dados de usuário',
        loadComponent: () => import('./paginas/meus-dados/meus-dados.component').then((m) => m.MeusDadosComponent),
      }
    ]
  },
] as Routes;
