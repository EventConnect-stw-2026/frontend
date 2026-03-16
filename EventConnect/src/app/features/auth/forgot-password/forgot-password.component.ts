import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  isSubmitting = false;
  message = '';
  errorMessage = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.message = '';
    this.errorMessage = '';
    this.cdr.detectChanges();

    const email = this.form.value.email ?? '';

    this.authService.forgotPassword(email)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          if (res?.status === 404 || res?.error?.status === 404) {
            this.errorMessage =
              res?.error?.message ||
              res?.message ||
              'Este correo no está registrado en EventConnect';
            this.message = '';
            this.form.reset();
          } else {
            this.message =
              res?.message ||
              'Hemos enviado un enlace de recuperación a tu correo';
            this.errorMessage = '';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('forgot-password ERROR:', err);

          if (err.status === 404) {
            this.errorMessage =
              err.error?.message ||
              'Este correo no está registrado en EventConnect';
            this.message = '';
          } else {
            this.errorMessage =
              err.error?.message ||
              'Error al enviar el enlace. Intenta más tarde.';
            this.message = '';
          }
        }
      });
  }

  closeModal(): void {
    this.message = '';
    this.errorMessage = '';
    this.form.reset();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}