import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { BookingService, TicketRequest } from './booking.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private paymentApiUrl = 'http://localhost:8080/api/transactions'; 
  constructor(
    private http: HttpClient,
    private bookingService: BookingService
  ) {}

  initiatePayment(bookingData: TicketRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const paymentPayload = {
      amount: bookingData.totalAmount,
      currency: 'LKR',
      description: `Booking for ${bookingData.name}`,
      customer: {
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phoneNumber
      },
      ticketDetails: {
        eventId: bookingData.eventId,
        categoryQuantities: bookingData.categoryQuantities
      }
    };

    return this.http.post(this.paymentApiUrl, paymentPayload, { headers }).pipe(
      switchMap((response: any) => {
        if (response.status === 'SUCCESS') { 
          return this.bookingService.bookTicket(bookingData);
        } else {
          return throwError(() => new Error('Payment failed'));
        }
      }),
      catchError((error) => {
        console.error('Payment error:', error);
        return throwError(() => new Error('Payment processing failed'));
      })
    );
  }
}