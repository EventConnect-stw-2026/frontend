import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.endsWith('/refresh')) {
        // Intentar refresh
        return authService.refresh().pipe(
          switchMap(() => next(req)),
          catchError(() => of(error))
        );
      }
      return of(error);
    })
  );
};