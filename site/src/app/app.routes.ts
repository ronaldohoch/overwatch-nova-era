import { Routes } from '@angular/router';

export const routes: Routes = [
    {
      path: '',
      title: 'Copa Overwatch - Nova Era',
      loadComponent: () => import('./features/pagina-inicial/pagina-inicial').then(m=>m.PaginaInicial)
    },
];
