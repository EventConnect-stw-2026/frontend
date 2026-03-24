import { Component, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  isSubmitting = false;
  errorMessage = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '1063164198867-j2uge7o0i7dqgd14b0d2g7e377s7atik.apps.googleusercontent.com',
        callback: (response: any) => {
          this.ngZone.run(() => {
            this.handleGoogleSignIn(response);
          });
        }
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (typeof google !== 'undefined') {
        const googleButton = document.getElementById('google-signin-button');
        if (googleButton) {
          google.accounts.id.renderButton(googleButton, {
            type: 'standard',
            size: 'large',
            text: 'signin_with',
            theme: 'outline',
            width: '100%'
          });
        }
      }
    }, 100);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const payload = {
      email: this.loginForm.value.email ?? '',
      password: this.loginForm.value.password ?? ''
    };

    this.authService.login(payload)
    .pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.errorMessage = '';
          this.cdr.detectChanges();
          const targetRoute = response.user.role === 'admin' ? '/admin/dashboard' : '/home';
          this.router.navigate([targetRoute]);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.errorMessage =
            err?.error?.message || 'No se pudo iniciar sesión';
          this.cdr.detectChanges();
        });
      }
    });
  }

  private handleGoogleSignIn(response: any): void {
    if (!response.credential) {
      this.errorMessage = 'Error al obtener credenciales de Google';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.loginWithGoogle({
      token: response.credential,
      isRegistering: false
    }).subscribe({
      next: (authResponse) => {
        this.ngZone.run(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
          const targetRoute = authResponse.user.role === 'admin' ? '/admin/dashboard' : '/home';
          this.router.navigate([targetRoute]);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.isSubmitting = false;
          this.errorMessage =
            err?.error?.message || 'Error al autenticar con Google';
          this.cdr.detectChanges();
        });
      }
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}