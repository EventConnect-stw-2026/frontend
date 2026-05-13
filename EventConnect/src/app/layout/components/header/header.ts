/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: header.ts
 * Descripción: Componente encargado de gestionar la cabecera principal de la aplicación,
 * mostrando la navegación, el estado de sesión, el menú responsive y las notificaciones.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';

// Componente encargado de gestionar el encabezado principal.
// Controla si el usuario ha iniciado sesión,
// el menú móvil y el indicador de notificaciones de amigos.
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class HeaderComponent implements OnInit {

  // Servicio de autenticación utilizado para conocer el estado de sesión.
  private authService = inject(AuthService);

  // Servicio global encargado de gestionar notificaciones de amigos y quedadas.
  private notificationsService = inject(NotificationsService);

  // Referencia para forzar la detección de cambios al actualizar notificaciones.
  private cdr = inject(ChangeDetectorRef);

  // Observable que indica si el usuario está autenticado.
  isLoggedIn$ = this.authService.isLoggedIn$();

  // Controla si el menú responsive está abierto o cerrado.
  menuOpen = false;

  // Indica si hay notificaciones pendientes en la sección de amigos.
  hasFriendsNotifications = false;

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Se suscribe al estado de login y, si el usuario está autenticado,
  // escucha las notificaciones de amigos y fuerza su actualización.
  ngOnInit(): void {
    this.isLoggedIn$.subscribe((isLoggedIn) => {
      if (!isLoggedIn) {
        this.hasFriendsNotifications = false;
        this.notificationsService.clearNotifications();
        this.cdr.detectChanges();
        return;
      }

      // Si el usuario está logueado, se actualiza el punto rojo de notificaciones.
      this.notificationsService.hasFriendsNotifications$.subscribe(value => {
        this.hasFriendsNotifications = value;
        this.cdr.detectChanges();
      });

      // Carga inicial de solicitudes, mensajes e invitaciones pendientes.
      this.notificationsService.refreshAllFriendsNotifications();
    });
  }
}