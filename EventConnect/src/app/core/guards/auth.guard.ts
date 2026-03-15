import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const url = route.routeConfig?.path;

  return authService.isLoggedIn$().pipe(
    map((isLoggedIn: boolean) => {
      // Si no está autenticado, bloquear /profile
      if (!isLoggedIn && url === 'profile') {
        return router.createUrlTree(['/login']);
      }
      // Si está autenticado, bloquear /login y /register
      if (isLoggedIn && (url === 'login' || url === 'register')) {
        return router.createUrlTree(['/home']);
      }
      // Permitir el acceso en otros casos
      return true;
    })
  );
};