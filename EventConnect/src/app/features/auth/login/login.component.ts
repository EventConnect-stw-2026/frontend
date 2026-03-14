import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

  isSubmitting = false;
  errorMessage = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    // Inicializar Google Sign-In
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '1063164198867-j2uge7o0i7dqgd14b0d2g7e377s7atik.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleSignIn(response)
      });
    }
  }

  ngAfterViewInit(): void {
    // Renderizar botón de Google después de que el DOM esté listo
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
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      email: this.loginForm.value.email ?? '',
      password: this.loginForm.value.password ?? ''
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'No se pudo iniciar sesión';
      }
    });
  }

  private handleGoogleSignIn(response: any): void {
  if (!response.credential) {
    this.errorMessage = 'Error al obtener credenciales de Google';
    return;
  }

  this.isSubmitting = true;
  this.errorMessage = '';

  this.authService.loginWithGoogle({ 
    token: response.credential,
    isRegistering: false  // ← Es LOGIN, no registro
  }).subscribe({
    next: () => {
      this.isSubmitting = false;
      this.router.navigate(['/home']);
    },
    error: (err) => {
      this.isSubmitting = false;
      this.errorMessage = err?.error?.message || 'Error al autenticar con Google';
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