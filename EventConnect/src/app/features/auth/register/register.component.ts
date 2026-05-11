/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: register.component.ts
 * Descripción: Componente encargado del registro de nuevos usuarios.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

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

// Declaración global del objeto de Google utilizado para el registro.
declare var google: any;

// Validador personalizado para comprobar que las dos contraseñas coinciden.
// Lee los campos password y confirmPassword del formulario.
// Devuelve un error si ambos existen y sus valores son distintos.
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

// Componente encargado de gestionar el formulario de registro.
// Permite crear una cuenta mediante formulario tradicional
// o registrarse utilizando autenticación con Google.
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit, AfterViewInit {

  // Servicio utilizado para construir el formulario reactivo.
  private fb = inject(FormBuilder);

  // Servicio de autenticación utilizado para registrar usuarios.
  private authService = inject(AuthService);

  // Servicio de navegación para redirigir tras el registro.
  private router = inject(Router);

  // Zona de Angular utilizada para gestionar callbacks externos de Google.
  private ngZone = inject(NgZone);

  // Referencia para forzar la actualización de la vista cuando cambia el estado.
  private cdr = inject(ChangeDetectorRef);

  // Indica si se está procesando actualmente el registro.
  isSubmitting = false;

  // Mensaje de error mostrado cuando falla el registro.
  errorMessage = '';

  // Controla si la contraseña principal se muestra como texto.
  showPassword = false;

  // Controla si la confirmación de contraseña se muestra como texto.
  showConfirmPassword = false;

  // Formulario reactivo de registro con validaciones de campos obligatorios.
  // También utiliza un validador personalizado para comprobar contraseñas.
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

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Inicializa Google Sign-In si el objeto google está disponible.
  // Define el callback que gestiona el registro con Google.
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

  // Método del ciclo de vida ejecutado tras inicializar la vista.
  // Renderiza el botón de registro con Google dentro del contenedor HTML.
  // Usa un pequeño retardo para asegurar que el elemento ya existe en el DOM.
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

  // Método ejecutado al enviar el formulario de registro.
  // Valida el formulario, construye el payload y llama al servicio de autenticación.
  // Si el registro es correcto, redirige al usuario a la pantalla principal.
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    // Datos enviados al backend para registrar el usuario.
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

  // Método privado encargado de gestionar el registro con Google.
  // Comprueba que exista credencial, la envía al backend
  // y redirige al usuario si la autenticación se completa correctamente.
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

  // Getter para acceder fácilmente al control de nombre.
  // Se utiliza desde la plantilla para mostrar validaciones.
  get name() {
    return this.registerForm.get('name');
  }

  // Getter para acceder fácilmente al control de username.
  // Se utiliza desde la plantilla para mostrar validaciones.
  get username() {
    return this.registerForm.get('username');
  }

  // Getter para acceder fácilmente al control de correo electrónico.
  // Se utiliza desde la plantilla para mostrar validaciones.
  get email() {
    return this.registerForm.get('email');
  }

  // Getter para acceder fácilmente al control de contraseña.
  // Se utiliza desde la plantilla para mostrar validaciones.
  get password() {
    return this.registerForm.get('password');
  }

  // Getter para acceder fácilmente al control de confirmación de contraseña.
  // Se utiliza desde la plantilla para mostrar validaciones.
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
}