import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-booking',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BannerComponent {
  event = {
    title: 'Wenas Nights',
    subtitle: 'BNS, Raini, Sarith Surith with News',
    date: '2025/09/06',
    venue: 'Saffron Beach hotel, Wadduwa',
    ticketPrices: [
      { type: 'SILVER', price: 3500 },
      { type: 'GOLD', price: 5000 },
      { type: 'PLATINUM', price: 7500 }
    ],
    bannerImage:"banner.png",
  };

  constructor(private router: Router) {}

  navigateToBooking() {
    this.router.navigate(['/booking']);
  }
}