/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: server.ts
 * Descripción: Servidor Express utilizado para ejecutar la
 * aplicación Angular en entorno SSR (Server Side Rendering).
 * Gestiona:
 * - archivos estáticos generados en /browser
 * - renderizado Angular SSR
 * - posible definición de endpoints REST
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

import express from 'express';
import { join } from 'node:path';

/**
 * Ruta absoluta donde se encuentran los archivos
 * compilados del frontend Angular.
 */
const browserDistFolder = join(
  import.meta.dirname,
  '../browser'
);

/**
 * Inicialización del servidor Express.
 */
const app = express();

/**
 * Motor SSR de Angular encargado del renderizado
 * de la aplicación en servidor.
 */
const angularApp = new AngularNodeAppEngine();

/* =========================================================
 * ENDPOINTS API
 * ========================================================= */

/**
 * Aquí podrían definirse endpoints REST adicionales.
 *
 * Ejemplo:
 *
 * app.get('/api/users', (req, res) => {
 *   res.json([...]);
 * });
 */

/* =========================================================
 * ARCHIVOS ESTÁTICOS
 * ========================================================= */

/**
 * Sirve los archivos estáticos generados tras
 * el build de Angular.
 *
 * Configuración:
 * - cache de 1 año
 * - evita servir index.html automáticamente
 * - desactiva redirecciones automáticas
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/* =========================================================
 * RENDERIZADO SSR
 * ========================================================= */

/**
 * Maneja cualquier petición restante renderizando
 * la aplicación Angular mediante SSR.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)

    .then((response) =>
      response
        ? writeResponseToNodeResponse(response, res)
        : next(),
    )

    .catch(next);
});

/* =========================================================
 * ARRANQUE DEL SERVIDOR
 * ========================================================= */

/**
 * Inicia el servidor únicamente cuando:
 * - el archivo es ejecutado directamente
 * - o se ejecuta mediante PM2
 */
if (
  isMainModule(import.meta.url) ||
  process.env['pm_id']
) {

  /**
   * Puerto del servidor.
   * Usa PORT del entorno o 4000 por defecto.
   */
  const port = process.env['PORT'] || 4000;

  /**
   * Inicio del servidor Express.
   */
  app.listen(port, (error) => {

    if (error) {
      throw error;
    }

    console.log(
      `Node Express server listening on http://localhost:${port}`
    );
  });
}

/* =========================================================
 * EXPORTACIÓN DEL HANDLER
 * ========================================================= */

/**
 * Handler utilizado por Angular CLI,
 * Firebase Functions o entornos similares.
 */
export const reqHandler =
  createNodeRequestHandler(app);