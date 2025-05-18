import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css'
})
export class BookingComponent {
  bookingForm = {
    name: '',
    email: '',
    phone: '',
    nic: ''
  };
  
  selectedTicket: string = 'SILVER';
  quantity: number = 1;
  ticketPrice: number = 3500;
  convenienceFee: number = 35;
  showDropdown: boolean = false;
  
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }
  
  selectTicket(ticket: string) {
    this.selectedTicket = ticket;
    
    switch(ticket) {
      case 'SILVER':
        this.ticketPrice = 3500;
        break;
      case 'GOLD':
        this.ticketPrice = 5000;
        break;
      case 'PLATINUM':
        this.ticketPrice = 7500;
        break;
    }
    
    this.showDropdown = false;
  }
  
  increaseQuantity() {
    this.quantity++;
  }
  
  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
  
  calculateTotal(): number {
    return (this.ticketPrice * this.quantity) + this.convenienceFee;
  }
  
  bookNow() {
    console.log('Booking details:', {
      ...this.bookingForm,
      ticket: this.selectedTicket,
      quantity: this.quantity,
      total: this.calculateTotal()
    });
    
    alert('Booking successful!');
  }
}