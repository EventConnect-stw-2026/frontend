/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: app.config.ts
 * Descripción: Configuración principal de Angular para la aplicación.
 * Define proveedores globales como rutas, cliente HTTP,
 * interceptores y gestión global de errores.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

import { provideRouter } from '@angular/router';

import {
  provideHttpClient,
  withFetch,
  withInterceptors
} from '@angular/common/http';

import { withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/**
 * Configuración principal de la aplicación Angular.
 */
export const appConfig: ApplicationConfig = {

  providers: [

    /**
     * Gestión global de errores del navegador.
     */
    provideBrowserGlobalErrorListeners(),

    /**
     * Configuración del sistema de rutas.
     */
    provideRouter(routes),

    /**
     * Cliente HTTP global de Angular.
     *
     * - withInterceptors:
     *   Añade interceptores HTTP personalizados.
     *
     * - authInterceptor:
     *   Inserta automáticamente el token JWT
     *   en las peticiones autenticadas.
     *
     * - withFetch:
     *   Utiliza Fetch API en lugar de XMLHttpRequest.
     */
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withFetch()
    )
  ]
};