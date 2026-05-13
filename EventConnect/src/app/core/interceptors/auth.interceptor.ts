/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: auth.interceptor.ts
 * Descripción: Interceptor que maneja la autenticación de las solicitudes HTTP.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

// El interceptor se encarga de agregar el token de autenticación a las solicitudes HTTP y manejar los errores 401 (Unauthorized) 
// para intentar un refresh del token.
// Si se detecta un error 401, el interceptor intentará refrescar el token utilizando el AuthService. Si el refresh es exitoso, 
// se reintentará la solicitud original. Si el refresh falla, se limpiará la sesión del usuario.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  return next(req).pipe(
    catchError((error) => {
      // Don't log 401s from login/register endpoints - they're expected authentication errors
      const isAuthRequest = req.url.includes('/login') || req.url.includes('/register');
      if (!isAuthRequest) {
        console.log('[AuthInterceptor] error status:', error.status, 'url:', error.url);
      }
      
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