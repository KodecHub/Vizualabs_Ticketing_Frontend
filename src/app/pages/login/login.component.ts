import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../../services/login.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';

  constructor(private loginService: LoginService, private router: Router) {}

  onSubmit() {
    this.loginService.login(this.email, this.password).subscribe({
      next: (isValid) => {
        if (isValid) {
          Swal.fire({
            icon: 'success',
            title: 'Login Successful',
            text: 'Welcome, Admin!',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/dashboard']);
          });
        } else {
          this.error = 'Invalid email or password';
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'Invalid email or password.',
          });
        }
      },
      error: () => {
        this.error = 'Login failed. Please try again.';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Login failed. Please try again.',
        });
      },
    });
  }
}