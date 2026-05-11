import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  console.log('[AuthInterceptor] intercepting:', req.method, req.url);
  return next(req).pipe(
    catchError((error) => {
      console.log('[AuthInterceptor] error status:', error.status, 'url:', error.url);
      if (error.status === 401 && !req.url.endsWith('/refresh') && !!authService.getCurrentUser()) {
        console.log('[AuthInterceptor] 401 detected, attempting refresh...');
        // Intentar refresh
        return authService.refresh().pipe(
          switchMap(() => {
            console.log('[AuthInterceptor] refresh successful, retrying request');
            return next(req);
          }),
          catchError((refreshError) => {
            console.log('[AuthInterceptor] refresh failed, clearing session');
            authService.clearSession();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};