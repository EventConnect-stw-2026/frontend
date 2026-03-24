import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

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