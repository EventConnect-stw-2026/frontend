import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

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
