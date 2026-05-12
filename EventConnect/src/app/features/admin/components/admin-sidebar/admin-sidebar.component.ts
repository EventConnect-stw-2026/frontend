/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin-sidebar.component.ts
 * Descripción: Componente encargado del menú lateral del panel de administración.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// Interface que representa la estructura de cada elemento
// mostrado dentro del menú lateral de administración.
interface MenuItem {

  // Texto descriptivo mostrado en el menú.
  label: string;

  // Ruta de navegación asociada al elemento.
  route: string;

  // Icono visual utilizado para representar la opción.
  icon: string;

  // Badge opcional utilizado para mostrar contadores o avisos.
  badge?: string | number;
}

// Componente encargado de mostrar el sidebar del panel de administración.
// Incluye las diferentes opciones de navegación disponibles
// para acceder a las secciones administrativas de la aplicación.
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {

  // Lista de elementos que aparecen en el menú lateral.
  // Cada elemento contiene texto, ruta e icono asociado.
  menuItems: MenuItem[] = [

    // Acceso al dashboard principal de administración.
    { label: 'Dashboard', route: '/admin/dashboard', icon: '📈' },

    // Acceso a la gestión de usuarios.
    { label: 'Usuarios', route: '/admin/users', icon: '👥' },

    // Acceso a la gestión de eventos.
    { label: 'Eventos', route: '/admin/events', icon: '📌' },

    // Acceso al apartado de reportes y moderación.
    { label: 'Reportes', route: '/admin/reports', icon: '📊' },

    // Acceso a la configuración general de la plataforma.
    { label: 'Configuración', route: '/admin/settings', icon: '⚙' }
  ];
}