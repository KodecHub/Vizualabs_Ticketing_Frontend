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
      currency: 'LKR',
      // redirectUrl: 'https://www.wenasevents.com/payment-success',
      webhook: 'https://vizualabs.shop/webhook',
    };

    Swal.fire({
      title: 'Processing Payment',  
      text: 'Please wait while we process your payment.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.bookingService.createTransaction(requestPayload).subscribe({
      next: (res: any) => {
        Swal.close();
        if (res.url) {
          const bookingDetails: TicketRequest = {
            name: this.bookingForm.value.name,
            email: this.bookingForm.value.email,
            phoneNumber: this.bookingForm.value.phone,
            nic: this.bookingForm.value.nic,
            transactionId: res.id,
            eventId: 'EV001',
            categoryQuantities: this.selectedTicket === 'VVIP TABLE'
              ? { [this.ticketTypeMap['VVIP']]: this.quantity * 10 }
              : { [this.ticketTypeMap[this.selectedTicket]]: this.quantity },
            totalAmount: this.calculateTotal()
          };
          this.bookingService.bookTicket(bookingDetails).subscribe({
            next: (ticketRes) => {
              Swal.fire({
                icon: 'success',
                title: 'Booking Confirmed',
                text: 'Your ticket has been reserved and email sent.',
                timer: 1500,
                showConfirmButton: false,
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
          Swal.fire({
            icon: 'info',
            title: 'Redirecting to Payment Gateway',
            text: 'Please complete the payment to confirm your booking. You will receive a confirmation email.',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = res.url; 
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
        Swal.close();
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
