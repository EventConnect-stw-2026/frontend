/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: reset-password.component.ts
 * Descripción: Componente encargado de restablecer la contraseña de usuario.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs';

// Componente encargado de gestionar el formulario de restablecimiento de contraseña.
// Obtiene el token desde la URL, valida las nuevas contraseñas
// y solicita al backend la actualización de la contraseña.
@Component({
  standalone: true,
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ResetPasswordComponent {

  // Servicio utilizado para construir el formulario reactivo.
  private fb = inject(FormBuilder);

  // Servicio utilizado para leer el token recibido en la URL.
  private route = inject(ActivatedRoute);

  // Servicio de navegación utilizado para volver al login.
  private router = inject(Router);

  // Servicio de autenticación utilizado para restablecer la contraseña.
  private authService = inject(AuthService);

  // Referencia para forzar la actualización de la vista cuando cambia el estado.
  private cdr = inject(ChangeDetectorRef);

  // Indica si se está enviando actualmente la nueva contraseña.
  isSubmitting = false;

  // Controla la visibilidad del campo de nueva contraseña.
  showPassword = false;

  // Controla la visibilidad del campo de confirmación de contraseña.
  showConfirmPassword = false;

  // Mensaje de éxito mostrado cuando la contraseña se actualiza correctamente.
  message = '';

  // Mensaje de error mostrado cuando falla el restablecimiento.
  errorMessage = '';

  // Token de recuperación obtenido desde los parámetros de la URL.
  token = this.route.snapshot.queryParamMap.get('token') ?? '';

  // Formulario reactivo con validación de contraseña mínima y confirmación.
  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  // Método ejecutado al enviar el formulario.
  // Comprueba que exista token, valida las contraseñas
  // y llama al backend para guardar la nueva contraseña.
  onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    // Validación manual para asegurar que ambas contraseñas coinciden.
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

        // Mensaje mostrado cuando el backend confirma el cambio.
        this.message = res.message;
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => {

        // Mensaje mostrado si el token no es válido o falla la petición.
        this.errorMessage = err?.error?.message || 'Error al restablecer la contraseña';
        this.message = '';
        this.cdr.detectChanges();
      }
    });
  }

  // Método para cerrar el modal de éxito o error.
  // Limpia los mensajes visibles y reinicia el formulario.
  // Permite repetir el proceso si fuera necesario.
  closeModal(): void {
    this.message = '';
    this.errorMessage = '';
    this.form.reset();
  }

  // Método para navegar de vuelta a la pantalla de login.
  // Se utiliza tras completar correctamente el cambio de contraseña.
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}