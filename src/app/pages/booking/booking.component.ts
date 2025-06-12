import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService, TicketRequest } from '../../services/booking.service';
import Swal from 'sweetalert2';

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

  private readonly ticketTypeMap: { [key: string]: number } = {
    'GENERAL': 3500,
    'VIP': 5000,
    'VVIP': 7500,
    'VVIP TABLE': 75000
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly bookingService: BookingService
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
      Swal.fire({
        icon: 'error',
        title: 'Form Invalid',
        text: 'Please fill out all required fields correctly.',
        confirmButtonText: 'OK',
      });
      return;
    }

    const requestPayload = {
      amount: this.calculateTotal() * 100, 
      currency: 'LKR'
    };

    this.bookingService.createTransaction(requestPayload).subscribe({
      next: (res: any) => {
        console.log('Sending Payment Request:', requestPayload);
        console.log('Payment Response:', res);
        if (res.url) {
          console.log('Redirecting to Payment Gateway:', res.url);
          window.location.href = res.url; 
          const request: TicketRequest = {
            name: this.bookingForm.value.name,
            email: this.bookingForm.value.email,
            phoneNumber: this.bookingForm.value.phone,
            nic: this.bookingForm.value.nic,
            eventId: 'EV001',
            categoryQuantities: this.selectedTicket === 'VVIP TABLE'
              ? { [this.ticketTypeMap['VVIP']]: this.quantity * 10 }
              : { [this.ticketTypeMap[this.selectedTicket]]: this.quantity },
            totalAmount: this.calculateTotal()
          };
          this.bookingService.bookTicket(request).subscribe({
            next: (ticketRes) => {
              console.log('Booking Successful:', ticketRes);
              Swal.fire({
                icon: 'success',
                title: 'Booking Confirmed',
                text: 'Your ticket has been reserved and email sent.',
                timer: 1500,
                showConfirmButton: false,
              }).then(() => {
                this.router.navigate(['/qr'], { state: { ticketResponse: ticketRes } });
              });
            },
            error: (err) => {
              console.error('Booking failed:', err);
              Swal.fire({
                icon: 'error',
                title: 'Booking Failed',
                text: 'Payment succeeded but booking failed. Please contact support.',
                confirmButtonText: 'OK',
              });
            }
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Payment Issue',
            text: 'No payment URL received.',
            confirmButtonText: 'OK',
          });
        }
      },
      error: (err) => {
        console.error('Payment failed:', err);
        Swal.fire({
          icon: 'error',
          title: 'Payment Failed',
          text: err.status === 500 ? 'Server error, please try again later.' : 'Payment initiation failed. Please try again.',
          confirmButtonText: 'OK',
        });
      },
    });
  }
}