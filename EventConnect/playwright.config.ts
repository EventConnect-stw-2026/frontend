/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: playwright.config.ts
 * Descripción: Configuración principal de Playwright para
 * la ejecución de pruebas end-to-end (E2E).
 * Configura:
 * - directorio de tests
 * - navegador utilizado
 * - reintentos automáticos
 * - generación de reportes
 * - capturas y trazas de error
 * - variables de entorno
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({

  /**
   * Script ejecutado antes de comenzar los tests.
   */
  globalSetup: './e2e/global-setup.ts',

  /**
   * Directorio donde se encuentran los tests E2E.
   */
  testDir: './e2e',

  /**
   * Configuración TypeScript específica para E2E.
   */
  tsconfig: './e2e/tsconfig.json',

  /**
   * Desactiva ejecución completamente paralela.
   */
  fullyParallel: false,

  /**
   * Número de reintentos automáticos en caso de fallo.
   */
  retries: 1,

  /**
   * Tipo de reporte generado.
   */
  reporter: 'html',

  /**
   * Configuración global de ejecución.
   */
  use: {

    /**
     * URL base de la aplicación.
     */
    baseURL:
      process.env['BASE_URL'] ||
      'http://localhost:4200',

    /**
     * Genera trazas únicamente en reintentos.
     */
    trace: 'on-first-retry',

    /**
     * Capturas de pantalla solo en fallos.
     */
    screenshot: 'only-on-failure',
  },

  /**
   * Navegadores/proyectos de testing.
   */
  projects: [
    {
      name: 'chromium',

      use: {
        ...devices['Desktop Chrome']
      },
    },
  ],
});