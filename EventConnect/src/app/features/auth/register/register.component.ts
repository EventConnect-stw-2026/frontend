import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  NgZone,
  OnInit
} from '@angular/core';
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
import { finalize } from 'rxjs/operators';
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
export class RegisterComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

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
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id:
          '1063164198867-j2uge7o0i7dqgd14b0d2g7e377s7atik.apps.googleusercontent.com',
        callback: (response: any) => {
          this.ngZone.run(() => {
            this.handleGoogleSignUp(response);
          });
        }
      });
    }
  }

  ngAfterViewInit(): void {
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
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const payload = {
      name: this.registerForm.value.name ?? '',
      username: this.registerForm.value.username ?? '',
      email: this.registerForm.value.email ?? '',
      password: this.registerForm.value.password ?? ''
    };

    this.authService
      .register(payload)
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.isSubmitting = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.router.navigate(['/home']);
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.errorMessage =
              err?.error?.message || 'No se pudo registrar el usuario';
            this.cdr.detectChanges();
          });
        }
      });
  }

  private handleGoogleSignUp(response: any): void {
    if (!response.credential) {
      this.errorMessage = 'Error al obtener credenciales de Google';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService
      .loginWithGoogle({
        token: response.credential,
        isRegistering: true
      })
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            this.isSubmitting = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.router.navigate(['/home']);
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.errorMessage =
              err?.error?.message || 'Error al registrarse con Google';
            this.cdr.detectChanges();
          });
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