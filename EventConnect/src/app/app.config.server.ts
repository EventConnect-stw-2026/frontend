/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: app.config.server.ts
 * Descripción: Configuración específica del entorno SSR (Server Side Rendering)
 * para Angular. Combina la configuración principal de la aplicación con la
 * configuración del renderizado en servidor.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import {
  mergeApplicationConfig,
  ApplicationConfig
} from '@angular/core';

import {
  provideServerRendering,
  withRoutes
} from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Configuración específica del servidor.
 * Añade soporte SSR y rutas del lado servidor.
 */
const serverConfig: ApplicationConfig = {

  providers: [

    /**
     * Habilita el renderizado en servidor (SSR)
     * utilizando las rutas definidas para el servidor.
     */
    provideServerRendering(
      withRoutes(serverRoutes)
    )
  ]
};

/**
 * Configuración final combinada.
 * Une la configuración principal de la aplicación
 * con la configuración específica del servidor.
 */
export const config = mergeApplicationConfig(
  appConfig,
  serverConfig
);