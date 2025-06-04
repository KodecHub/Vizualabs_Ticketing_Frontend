import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService, BookingData } from '../../services/booking.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent {
  bookingForm: FormGroup;
  selectedTicket: string = 'GENERAL';
  quantity: number = 1;
  ticketPrice: number = 3500;
  showDropdown: boolean = false;

  private ticketTypeMap: { [key: string]: number } = {
    'GENERAL': 1,
    'VIP': 2,
    'VVIP': 3,    
    'VVIP TABLE': 4
  }

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private bookingService: BookingService
  ) {
    this.bookingForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      nic: ['', Validators.required]
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  selectTicket(ticket: string) {
    this.selectedTicket = ticket;
    switch (ticket) {
      case 'GENERAL':
        this.ticketPrice = 3500;
        break;
      case 'VIP':
        this.ticketPrice = 5000;
        break;
      case 'VVIP':
        this.ticketPrice = 7500;
        break;
      case 'VVIP TABLE':
        this.ticketPrice = 75000; 
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

  calculateConvenienceFee(): number {
    return this.ticketPrice * this.quantity * 0.01;
  }

  calculateTotal(): number {
    return this.ticketPrice * this.quantity + this.calculateConvenienceFee();
  }

  bookNow() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    const bookingData: BookingData = {
      name: this.bookingForm.value.name,
      email: this.bookingForm.value.email,
      phoneNumber: this.bookingForm.value.phone, 
      nic: this.bookingForm.value.nic,
      categoryQuantities: { [this.ticketTypeMap[this.selectedTicket]]: this.quantity }, 
      eventId: 'EV001' 
    };

    console.log('Sending Booking Data:', bookingData); 

    this.bookingService.bookTicket(bookingData).subscribe({
      next: (response) => {
        if (response) {
          console.log('Booking successful', response);
          this.router.navigate(['/qr'], { state: { bookingData: response.bookingData } });
          alert('Booking successful! Your ticket details have been sent to your email.');
        } else {
          console.error('Received null response from backend');
          alert('Booking failed: No response from server.');
        }
      },
      error: (error) => {
        console.error('Booking failed', error);
        alert('Booking failed: ' + error.message);
      }
    });
  }
}