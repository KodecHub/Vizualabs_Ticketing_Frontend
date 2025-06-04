// src/app/services/booking.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BookingData {
  name: string;
  email: string;
  phoneNumber: string;
  nic: string;
  categoryQuantities: { [key: number]: number };
  eventId: string;
}

export interface TicketResponse {
  message: string;
  ticketId: string;
  bookingData: BookingData;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  bookTicket(bookingData: BookingData): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.baseUrl}/tickets/generate`, bookingData);
  }
}