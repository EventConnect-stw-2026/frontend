/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event-card.ts
 * Descripción: Componente reutilizable para mostrar una tarjeta de evento
 * con imagen, categoría, fecha, ubicación y descripción resumida.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StripHtmlPipe } from '../../pipes/strip-html.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-event-card',
  standalone: true,

  // Imports necesarios para el componente standalone
  imports: [
    CommonModule,
    StripHtmlPipe,
    RouterLink
  ],

  templateUrl: './event-card.html',
  styleUrl: './event-card.scss'
})
export class EventCardComponent {

  /**
   * Evento recibido desde el componente padre.
   * Contiene toda la información que se mostrará en la tarjeta.
   */
  @Input() event: any;

  /**
   * Imagen por defecto utilizada cuando un evento
   * no tiene imagen válida o falla la carga.
   */
  defaultImage = 'assets/images/placeholder.svg';

  /**
   * Devuelve la imagen del evento.
   * Si no existe o es inválida, devuelve la imagen placeholder.
   *
   * @param event Evento recibido
   * @returns URL de la imagen a mostrar
   */
  getImage(event: any): string {

    const img = event?.imageUrl;

    // Validación básica de imagen
    if (!img || typeof img !== 'string' || img.trim() === '') {
      return this.defaultImage;
    }

    return img;
  }

  /**
   * Se ejecuta cuando ocurre un error cargando la imagen.
   * Sustituye automáticamente la imagen rota por el placeholder.
   *
   * @param event Evento del DOM asociado al error de imagen
   */
  onImageError(event: any) {
    event.target.src = this.defaultImage;
  }
}