import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private baseUrl: string = 'http://localhost:8080/api/tickets/bulk';

  constructor(private http: HttpClient) {}

  generateBulkQR(
    eventId: string,
    count: number,
    category: number // Keep as number if backend expects a price/ID, otherwise change to string
  ): Observable<Blob> {
    const url = `${this.baseUrl}/${eventId}/${count}/${category}`;
    return this.http.post(url, null, { responseType: 'blob' });
  }
}