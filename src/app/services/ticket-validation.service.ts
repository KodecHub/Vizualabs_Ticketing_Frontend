import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ValidationResponse {
  valid: boolean;
  message: string;
  ticketId?: string;
  status?: string;
  remainingQuantity?: number;
}

@Injectable({ providedIn: 'root' })
export class TicketValidationService {
  private readonly API_BASE_URL = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  validateTicket(ticketId: string, quantity: number): Observable<ValidationResponse> {
    const params = new URLSearchParams();
    params.append('ticketId', ticketId);
    params.append('validateQuantity', quantity.toString());

    return this.http.post<ValidationResponse>(
      `${this.API_BASE_URL}/tickets/validate?${params.toString()}`,
      {},
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }
    );
  }
}