import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TicketRequest {
  name: string;
  email: string;
  phoneNumber: string;
  nic: string;
  eventId: string;
  categoryQuantities: { [key: number]: number };
  totalAmount: number; // Added totalAmount field
}

export interface TicketResponse {
  ticketId: string;
  customerId: string;
  name: string;
  email: string;
  phoneNumber: string;
  nic: string;
  quantity: number;
  remainingQuantity: number;
  category: number;
  eventId: string;
  status: string;
  createdAt: string;
  ticketIds: string[];
  eventIds: string[];
  remainingTicketsForEvent: { [key: number]: number };
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private baseUrl = 'http://localhost:8080/api/tickets';

  constructor(private http: HttpClient) {}

  bookTicket(request: TicketRequest): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.baseUrl}/generate`, request);
  }
}