import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare var google: any;

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }

  return null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isSubmitting = false;
  errorMessage = '';

  registerForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordMatchValidator }
  );

  ngOnInit(): void {
    // Inicializar Google Sign-In
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '1063164198867-j2uge7o0i7dqgd14b0d2g7e377s7atik.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleSignUp(response)
      });
    }
  }

  ngAfterViewInit(): void {
    // Renderizar botón de Google después de que el DOM esté listo
    setTimeout(() => {
      if (typeof google !== 'undefined') {
        const googleButton = document.getElementById('google-signup-button');
        if (googleButton) {
          google.accounts.id.renderButton(googleButton, {
            type: 'standard',
            size: 'large',
            text: 'signup_with',
            theme: 'outline',
            width: '100%'
          });
        }
      }
    }, 100);
  }
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      name: this.registerForm.value.name ?? '',
      username: this.registerForm.value.username ?? '',
      email: this.registerForm.value.email ?? '',
      password: this.registerForm.value.password ?? ''
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'No se pudo registrar el usuario';
      }
    });
  }

  private handleGoogleSignUp(response: any): void {
    if (!response.credential) {
      this.errorMessage = 'Error al obtener credenciales de Google';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle({ 
      token: response.credential,
      isRegistering: true  // ← Es REGISTRO, no login
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'Error al registrarse con Google';
      }
    });
  }

  get name() {
    return this.registerForm.get('name');
  }

  get username() {
    return this.registerForm.get('username');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
}