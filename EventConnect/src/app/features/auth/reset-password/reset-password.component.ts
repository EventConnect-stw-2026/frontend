import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  isSubmitting = false;
  message = '';
  errorMessage = '';

  token = this.route.snapshot.queryParamMap.get('token') ?? '';

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.message = '';
    this.cdr.detectChanges();

    this.authService.resetPassword(this.token, this.form.value.password ?? '')
    .pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (res) => {
        this.message = res.message;
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Error al restablecer la contraseña';
        this.message = '';
        this.cdr.detectChanges();
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