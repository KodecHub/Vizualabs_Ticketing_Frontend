import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private baseUrl: string = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  registerEvent(
    eventName: string,
    eventId: string,
    requestBody: any
  ): Observable<any> {
    const params = new HttpParams()
      .set('eventName', eventName)
      .set('eventId', eventId);

    return this.http.post<any>(`${this.baseUrl}/register-event`, requestBody, {
      params,
    });
  }

  getEvent(eventId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/event/${eventId}`);
  }
}
