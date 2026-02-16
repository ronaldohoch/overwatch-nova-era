import { Routes } from '@angular/router';

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
    path: 'login',
    title: 'Copa Overwatch - Login',
    loadComponent: () => import('./features/login/login.component').then(m=>m.LoginComponent)
  },
];
