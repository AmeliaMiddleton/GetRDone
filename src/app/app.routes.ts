import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'log',
    loadComponent: () => import('./features/log/log').then(m => m.LogComponent)
  },
  {
    path: 'setup',
    loadComponent: () => import('./features/setup/setup').then(m => m.SetupComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/reports').then(m => m.ReportsComponent)
  },
  { path: '', redirectTo: 'log', pathMatch: 'full' },
  { path: '**', redirectTo: 'log' }
];
