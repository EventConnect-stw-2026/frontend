/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: main.server.ts
 * Descripción: Punto de entrada del renderizado en servidor (SSR).
 * Inicializa la aplicación Angular en entorno servidor.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import {
  BootstrapContext,
  bootstrapApplication
} from '@angular/platform-browser';

import { App } from './app/app';
import { config } from './app/app.config.server';

/**
 * Función de bootstrap utilizada por Angular SSR.
 *
 * Inicializa la aplicación utilizando:
 * - el componente raíz App
 * - la configuración específica del servidor
 * - el contexto SSR proporcionado por Angular
 */
const bootstrap = (context: BootstrapContext) =>

  bootstrapApplication(
    App,
    config,
    context
  );

/**
 * Exportación por defecto requerida por Angular SSR.
 */
export default bootstrap;