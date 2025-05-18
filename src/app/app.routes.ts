import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'booking',
        loadComponent: () => import('./pages/booking/booking.component').then(m => m.BookingComponent)  
    }
];
