/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: strip-html.pipe.ts
 * Descripción: Pipe personalizada que elimina etiquetas HTML de un texto.
 * Se utiliza para mostrar descripciones limpias y resumidas en la interfaz.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripHtml',
  standalone: true
})
export class StripHtmlPipe implements PipeTransform {

  /**
   * Elimina todas las etiquetas HTML de un texto.
   *
   * Ejemplo:
   * "<p>Hola <b>mundo</b></p>" → "Hola mundo"
   *
   * @param value Texto original con posibles etiquetas HTML
   * @returns Texto limpio sin etiquetas HTML
   */
  transform(value: string): string {

    // Si el valor es nulo, undefined o vacío
    if (!value) {
      return '';
    }

    // Elimina etiquetas HTML usando expresión regular
    return value.replace(/<[^>]*>/g, '').trim();
  }
}