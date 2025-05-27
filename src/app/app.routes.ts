import { Routes } from '@angular/router';
import { BannerComponent } from './pages/banner/banner.component';

export const routes: Routes = [
    {
        path: '',
        component: BannerComponent
    },
    {
        path: 'booking',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) 
    }
];
