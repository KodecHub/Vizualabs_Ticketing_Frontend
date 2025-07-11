import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private baseUrl: string = 'http://localhost:8080/api/tickets';

  constructor(private http: HttpClient) {}

  generateBulkQR(
    eventId: string,
    count: number,
    category: number
  ): Observable<Blob> {
    const url = `${this.baseUrl}/bulk/${eventId}/${count}/${category}`;
    return this.http.post(url, null, { responseType: 'blob' }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.error instanceof Blob) {
          return new Observable<never>((observer) => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const errorJson = JSON.parse(reader.result as string);
                observer.error(
                  new HttpErrorResponse({
                    error: errorJson,
                    status: error.status,
                    statusText: error.statusText,
                  })
                );
              } catch (e) {
                observer.error(error);
              }
            };
            reader.onerror = () => observer.error(error);
            reader.readAsText(error.error);
          });
        }
        return throwError(() => error);
      })
    );
  }

  getTicketDetails(ticketId: string) {
    return this.http.get<any>(
      `${this.baseUrl}/${encodeURIComponent(ticketId)}`
    );
  }

  getTicketById(ticketId: string) {
    return this.http.get<any>(
      `${this.baseUrl}/${encodeURIComponent(ticketId)}`
    );
  }

  validateAndUseTicket(ticketId: string, validateQuantity: number = 1) {
    return this.http.post<any>(
      `${this.baseUrl}/validate?ticketId=${encodeURIComponent(
        ticketId
      )}&validateQuantity=${validateQuantity}`,
      {}
    );
  }
}
