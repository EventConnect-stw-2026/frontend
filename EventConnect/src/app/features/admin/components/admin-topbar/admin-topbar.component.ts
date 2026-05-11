/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin-topbar.component.ts
 * Descripción: Componente encargado de la barra superior del panel de administración.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

// Componente encargado de mostrar la barra superior
// del panel de administración.
// Incluye el título dinámico de la sección actual
// y las opciones relacionadas con la sesión del administrador.
@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss'
})
export class AdminTopbarComponent {

  // Título dinámico recibido desde el componente padre.
  @Input() title = '';

  // Variable que controla la visibilidad del menú desplegable.
  showMenu = false;

  // Servicios utilizados para gestionar autenticación y navegación.
  private authService = inject(AuthService);
  private router = inject(Router);

  // Método para mostrar u ocultar el menú desplegable del administrador.
  // Alterna el valor booleano de la variable showMenu.
  // Se ejecuta al pulsar sobre el perfil del administrador.
  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  // Método para cerrar la sesión del administrador.
  // Invoca el servicio de autenticación y redirige al login.
  // Se ejecuta desde el botón de cerrar sesión.
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Método para cerrar manualmente el menú desplegable.
  // Cambia el estado de visibilidad del menú a falso.
  // Se utiliza tras realizar acciones dentro del menú.
  closeMenu() {
    this.showMenu = false;
  }
}