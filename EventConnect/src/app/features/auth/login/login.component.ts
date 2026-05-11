/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: login.component.ts
 * Descripción: Componente encargado del inicio de sesión de usuarios.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

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

// Declaración global del objeto de Google utilizado para el inicio de sesión.
declare var google: any;

// Componente encargado de gestionar el formulario de inicio de sesión.
// Permite autenticarse mediante correo y contraseña,
// así como mediante el botón de Google Sign-In.
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  // Servicio utilizado para crear el formulario reactivo.
  private fb = inject(FormBuilder);

  // Servicio de autenticación utilizado para iniciar sesión.
  private authService = inject(AuthService);

  // Servicio de navegación utilizado para redirigir tras el login.
  private router = inject(Router);

  // Referencia para forzar la actualización de la vista cuando cambia el estado.
  private cdr = inject(ChangeDetectorRef);

  // Zona de Angular utilizada para asegurar la detección de cambios tras callbacks externos.
  private ngZone = inject(NgZone);

  // Indica si se está procesando actualmente el inicio de sesión.
  isSubmitting = false;

  // Mensaje de error mostrado cuando falla la autenticación.
  errorMessage = '';

  // Controla si la contraseña se muestra como texto o permanece oculta.
  showPassword = false;

  // Formulario reactivo de inicio de sesión con validaciones básicas.
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Inicializa el cliente de Google Sign-In si el objeto google está disponible.
  // Define el callback que se ejecutará cuando Google devuelva credenciales.
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

  // Método del ciclo de vida ejecutado tras inicializar la vista.
  // Renderiza el botón de Google dentro del contenedor correspondiente.
  // Se usa un pequeño retardo para asegurar que el elemento existe en el DOM.
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (typeof google !== 'undefined') {
        const googleButton = document.getElementById('google-signin-button');
        if (googleButton) {
          google.accounts.id.renderButton(googleButton, {
            type: 'standard',
            size: 'large',
            text: 'signin_with',
            theme: 'outline'
          });
        }
      }
    }, 100);
  }

  // Método ejecutado al enviar el formulario de login.
  // Valida los campos, construye el payload y llama al servicio de autenticación.
  // Redirige al usuario según su rol tras iniciar sesión correctamente.
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    // Datos enviados al backend para iniciar sesión.
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

          // Redirección diferenciada según el rol del usuario autenticado.
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

  // Método privado encargado de gestionar el inicio de sesión con Google.
  // Valida que exista credencial, la envía al backend
  // y redirige al usuario según su rol si la autenticación es correcta.
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

          // Redirección diferenciada según el rol recibido desde el backend.
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

  // Getter para acceder fácilmente al control de correo electrónico.
  // Se utiliza desde la plantilla para mostrar validaciones.
  get email() {
    return this.loginForm.get('email');
  }

  // Getter para acceder fácilmente al control de contraseña.
  // Se utiliza desde la plantilla para mostrar validaciones.
  get password() {
    return this.loginForm.get('password');
  }
}