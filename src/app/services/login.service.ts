import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = 'http://3.0.89.241:8080/api/login';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<boolean> {
    return this.http
      .post<boolean>(this.apiUrl, { email, password })
      .pipe(
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => new Error('Login failed'));
        })
      );
  }
}