import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authFlagKey = 'isAuthenticated';

  setAuthenticated(isAuthenticated: boolean): void {
    if (isAuthenticated) {
      sessionStorage.setItem(this.authFlagKey, 'true');
    } else {
      sessionStorage.removeItem(this.authFlagKey);
    }
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem(this.authFlagKey) === 'true';
  }
}
