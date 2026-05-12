/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin.guard.ts
 * Descripción: Guard que protege las rutas de administrador.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

// El guard verifica si el usuario tiene el rol de 'admin' para permitir el acceso a las rutas protegidas.
// Si el usuario no es admin, se redirige a la página de inicio. Si ocurre un error (por ejemplo, el usuario no está autenticado), 
// se redirige a la página de login.
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getProfile().pipe(
    map((profile) => {
      if (profile?.role === 'admin') {
        return true;
      }
      return router.createUrlTree(['/home']);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
