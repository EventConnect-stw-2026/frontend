import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const url = route.routeConfig?.path;
  
  // Lista de rutas permitidas para usuarios autenticados
  const authenticatedRoutes = [
    'home', 'explore', 'map', 'events/:id', 'profile', 'profile/edit', 'favorites', 'stats', 'history', 'friends'
  ];
  // Lista de rutas permitidas para no autenticados
  const unauthenticatedRoutes = [
    'home', 'explore', 'map', 'events/:id', 'login', 'register'
  ];

  return authService.isLoggedIn$().pipe(
    map((isLoggedIn: boolean) => {
      if (isLoggedIn) {
        // Si autenticado, bloquear login y register
        if (url === 'login' || url === 'register') {
          return router.createUrlTree(['/home']);
        }
        // Permitir solo rutas de authenticatedRoutes
        if (!authenticatedRoutes.includes(url || '')) {
          return router.createUrlTree(['/home']);
        }
        return true;
      } else {
        // Si no autenticado, bloquear profile y rutas privadas
        if (!unauthenticatedRoutes.includes(url || '')) {
          return router.createUrlTree(['/login']);
        }
        return true;
      }
    })
  );
};