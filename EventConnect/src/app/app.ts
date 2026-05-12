/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: app.ts
 * Descripción: Componente raíz principal de la aplicación Angular.
 * Contiene el RouterOutlet encargado de renderizar las vistas
 * según la ruta activa.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',

  // Imports necesarios para el componente standalone
  imports: [RouterOutlet],

  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  /**
   * Título principal de la aplicación.
   * Se define mediante signal para permitir reactividad.
   */
  protected readonly title = signal('EventConnect');
}