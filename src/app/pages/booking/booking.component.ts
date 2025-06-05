import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService, TicketRequest } from '../../services/booking.service';

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
    'GENERAL': 3500,
    'VIP': 5000,
    'VVIP': 7500,
    'VVIP TABLE': 75000
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private bookingService: BookingService
  ) {
    this.bookingForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      nic: ['', Validators.required]
    }, { validators: this.emailMatchValidator });
  }

  emailMatchValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.get('email')?.value;
    const confirmEmail = control.get('confirmEmail')?.value;
    return email === confirmEmail ? null : { emailMismatch: true };
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  selectTicket(ticket: string) {
    this.selectedTicket = ticket;
    this.ticketPrice = this.ticketTypeMap[ticket];
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

    const request: TicketRequest = {
      name: this.bookingForm.value.name,
      email: this.bookingForm.value.email,
      phoneNumber: this.bookingForm.value.phone,
      nic: this.bookingForm.value.nic,
      eventId: 'EV001',
      categoryQuantities: this.selectedTicket === 'VVIP TABLE' 
        ? { [this.ticketTypeMap['VVIP']]: this.quantity * 10 }
        : { [this.ticketTypeMap[this.selectedTicket]]: this.quantity }
    };

    console.log('Sending Ticket Request:', request);

    this.bookingService.bookTicket(request).subscribe({
      next: (response) => {
        console.log('Booking successful', response);
        this.router.navigate(['/qr'], { state: { ticketResponse: response } });
        alert('Booking successful! Your ticket has been reserved. Email delivery may be delayed.');
      },
      error: (error) => {
        console.error('Booking error', error);
        if (error.status === 500) {
          // Assume ticket is saved, as generateTicket saves before email
          alert('Booking successful, but email delivery failed. Check your QR code or contact support.');
          this.router.navigate(['/qr'], { state: { ticketResponse: null } });
        } else {
          alert('Booking failed: ' + (error.error?.message ?? 'Unknown error'));
        }
      }
    });
  }
}