/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: forgot-password.component.ts
 * Descripción: Componente encargado de solicitar la recuperación de contraseña.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs';

// Componente encargado de gestionar la pantalla de recuperación de contraseña.
// Permite introducir un correo electrónico, validar el formulario
// y solicitar al backend el envío del enlace de restablecimiento.
@Component({
  standalone: true,
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ForgotPasswordComponent {

  // Servicio utilizado para construir el formulario reactivo.
  private fb = inject(FormBuilder);

  // Servicio de autenticación utilizado para solicitar la recuperación.
  private authService = inject(AuthService);

  // Referencia para forzar la actualización de la vista cuando cambia el estado.
  private cdr = inject(ChangeDetectorRef);

  // Servicio de rutas utilizado para volver a la pantalla de login.
  private router = inject(Router);

  // Indica si se está enviando la solicitud al backend.
  isSubmitting = false;

  // Mensaje de éxito mostrado cuando se envía el enlace correctamente.
  message = '';

  // Mensaje de error mostrado cuando falla la recuperación.
  errorMessage = '';

  // Formulario reactivo con validación de correo obligatorio y formato email.
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Método ejecutado al enviar el formulario.
  // Valida el correo, llama al servicio de autenticación
  // y gestiona mensajes de éxito o error según la respuesta.
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.message = '';
    this.errorMessage = '';
    this.cdr.detectChanges();

    // Obtención segura del correo introducido en el formulario.
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

          // Gestión específica para respuestas que indiquen correo no registrado.
          if (res?.status === 404 || res?.error?.status === 404) {
            this.errorMessage =
              res?.error?.message ||
              res?.message ||
              'Este correo no está registrado en EventConnect';
            this.message = '';
            this.form.reset();
          } else {

            // Mensaje mostrado cuando el enlace se ha enviado correctamente.
            this.message =
              res?.message ||
              'Hemos enviado un enlace de recuperación a tu correo';
            this.errorMessage = '';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('forgot-password ERROR:', err);

          // Error específico cuando el correo no existe en la plataforma.
          if (err.status === 404) {
            this.errorMessage =
              err.error?.message ||
              'Este correo no está registrado en EventConnect';
            this.message = '';
          } else {

            // Error genérico para fallos inesperados del proceso.
            this.errorMessage =
              err.error?.message ||
              'Error al enviar el enlace. Intenta más tarde.';
            this.message = '';
          }
        }
      });
  }

  // Método para cerrar el modal de éxito o error.
  // Limpia los mensajes visibles y reinicia el formulario.
  // Permite al usuario intentar de nuevo la operación.
  closeModal(): void {
    this.message = '';
    this.errorMessage = '';
    this.form.reset();
  }

  // Método para navegar de vuelta a la pantalla de inicio de sesión.
  // Se ejecuta desde el modal de éxito.
  // Redirige al usuario a la ruta de login.
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}