/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin-layout.component.ts
 * Descripción: Componente principal del layout del panel de administración.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../components/admin-sidebar/admin-sidebar.component';

// Componente encargado de estructurar el layout general
// del panel de administración.
// Incluye el menú lateral y el contenedor principal
// donde se renderizan las vistas administrativas.
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {}