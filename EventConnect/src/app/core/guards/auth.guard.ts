/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: auth.guard.ts
 * Descripción: Guard que protege las rutas de autenticación.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

// El guard verifica si el usuario está autenticado para permitir el acceso a las rutas protegidas.
// Si el usuario no está autenticado, se redirige a la página de login.
// Además, si el usuario intenta acceder a las páginas de login o registro mientras ya está autenticado, se redirige a la página de inicio.
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const url = route.routeConfig?.path;
  const isAuthPage = url === 'login' || url === 'register';

  return authService.isLoggedIn$().pipe(
    map((isLoggedIn: boolean) => {
      if (isAuthPage && isLoggedIn) {
        return router.createUrlTree(['/home']);
      }

      if (!isAuthPage && !isLoggedIn) {
        return router.createUrlTree(['/login']);
      }

      return true;
    })
  );
};