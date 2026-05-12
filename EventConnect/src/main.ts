/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: main.ts
 * Descripción: Punto de entrada principal de la aplicación Angular
 * en el navegador. Inicializa el componente raíz utilizando
 * la configuración global definida en app.config.ts.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { bootstrapApplication } from '@angular/platform-browser';

import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Inicializa la aplicación Angular utilizando:
 * - el componente raíz App
 * - la configuración global appConfig
 */
bootstrapApplication(
  App,
  appConfig
)

/**
 * Captura errores producidos durante el arranque
 * de la aplicación y los muestra en consola.
 */
.catch((err) => console.error(err));