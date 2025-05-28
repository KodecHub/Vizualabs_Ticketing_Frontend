import { Routes } from '@angular/router';
import { BannerComponent } from './pages/banner/banner.component';

export const routes: Routes = [
    {
        path: '',
        component: BannerComponent
    },
    {
        path: 'admin',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) 
    },
    {   path: 'booking',   
        loadComponent: () => import('./pages/booking/booking.component').then(m => m.BookingComponent) 
    },
    {
        path: '',
        redirectTo: '/booking', pathMatch: 'full'
    },
];
