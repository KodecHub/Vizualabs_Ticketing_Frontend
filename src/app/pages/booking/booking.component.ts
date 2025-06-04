import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

  constructor(private fb: FormBuilder, private router: Router) {
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
    return (this.ticketPrice * this.quantity) + this.calculateConvenienceFee();
  }

  bookNow() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    const bookingDetails = {
      ...this.bookingForm.value,
      ticket: this.selectedTicket,
      quantity: this.quantity,
      total: this.calculateTotal()
    };

    console.log('Booking Details:', bookingDetails);

    this.router.navigate(['/qr'], { 
      state: { bookingData: bookingDetails }
    });

    alert('Booking successful! Redirecting to your ticket...');
  }
}