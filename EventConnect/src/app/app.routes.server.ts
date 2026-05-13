/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: app.routes.server.ts
 * Descripción: Configuración de rutas utilizadas durante el
 * renderizado en servidor (SSR/Prerender) de Angular.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import {
  RenderMode,
  ServerRoute
} from '@angular/ssr';

/**
 * Rutas utilizadas por Angular SSR.
 */
export const serverRoutes: ServerRoute[] = [

  /**
   * Ruta comodín.
   * Captura cualquier ruta de la aplicación.
   */
  {
    path: '**',

    /**
     * Renderizado estático prerenderizado.
     *
     * Angular genera previamente el HTML de las páginas
     * durante el proceso de build para mejorar:
     * - rendimiento
     * - SEO
     * - tiempo de carga inicial
     */
    renderMode: RenderMode.Prerender
  }
];