/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: auth.service.ts
 * Descripción: Servicio para la gestión de autenticación, sesión y perfil de usuario.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map, catchError, take, defaultIfEmpty } from 'rxjs/operators';
import { of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

// Interface para representar los datos necesarios para iniciar sesión mediante correo electrónico y contraseña.
interface LoginPayload {
  email: string;
  password: string;
}

// Interface para representar los datos enviados al backend durante el inicio de sesión con Google.
interface GoogleLoginPayload {
  token: string;
  isRegistering?: boolean;
}

// Interface para representar los datos necesarios para registrar un nuevo usuario en la plataforma.
interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

// Interface para representar la respuesta del backend tras una operación de autenticación,
// incluyendo el mensaje, el token y los datos principales del usuario autenticado.
interface AuthResponse {
  message: string;
  token: string;
  user: {
    _id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    isBlocked: boolean;
    avatarUrl: string;
    bio: string;
    location: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Servicio para la gestión de autenticación en EventConnect.
// Permite iniciar sesión, registrarse, cerrar sesión, comprobar la sesión activa,
// actualizar el perfil del usuario y gestionar recuperación de contraseña.
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private httpBackend = inject(HttpBackend);
  private rawHttp = new HttpClient(this.httpBackend);
  private apiUrl = environment.apiUrl + '/auth';

  // Cache del usuario autenticado en memoria.
  private currentUserSubject = new BehaviorSubject<any>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  // Cache para evitar repetir comprobaciones de sesión innecesarias.
  private sessionCheck$: Observable<boolean> | null = null;

  // Método para obtener el perfil del usuario autenticado desde el backend.
  // Si la petición es correcta, actualiza el usuario cacheado en memoria.
  // También marca en localStorage que existe una sesión activa.
  getProfile(): Observable<any> {
    console.log('[AuthService] getProfile() called');
    return this.http.get(`${this.apiUrl}/profile`, { withCredentials: true }).pipe(
      tap((user) => {
        console.log('[AuthService] getProfile response:', user);
        this.currentUserSubject.next(user);
        try { localStorage.setItem('sessionPresent', 'true'); } catch (e) {}
      })
    );
  }

  // Método para refrescar la sesión del usuario autenticado.
  // Realiza una petición al backend para renovar o validar la sesión actual.
  // Si tiene éxito, mantiene registrada la sesión en localStorage.
  refresh(): Observable<any> {
    console.log('[AuthService] refresh() called');
    return this.http.post(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(() => {
        console.log('[AuthService] refresh() successful');
        try { localStorage.setItem('sessionPresent', 'true'); } catch (e) {}
      })
    );
  }

  // Método para iniciar sesión con correo electrónico y contraseña.
  // Envía las credenciales al backend y guarda el usuario recibido si la autenticación es correcta.
  // Además, actualiza el estado de sesión tanto en memoria como en localStorage.
  login(payload: LoginPayload): Observable<AuthResponse> {
    console.log('[AuthService] login() called');
    return this.rawHttp.post<AuthResponse>(`${this.apiUrl}/login`, payload, { withCredentials: true }).pipe(
      tap((res) => {
        console.log('[AuthService] login response:', res?.user);
        if (res?.user) this.currentUserSubject.next(res.user);
        this.sessionCheck$ = of(!!res?.user);
        try { 
          localStorage.setItem('sessionPresent', !!res?.user ? 'true' : 'false');
          console.log('[AuthService] sessionPresent set to:', !!res?.user ? 'true' : 'false');
        } catch (e) {}
      })
    );
  }

  // Método para iniciar sesión mediante Google.
  // Envía el token de Google al backend para validar la identidad del usuario.
  // Si la respuesta contiene usuario, actualiza la sesión cacheada.
  loginWithGoogle(payload: GoogleLoginPayload): Observable<AuthResponse> {
    return this.rawHttp.post<AuthResponse>(`${this.apiUrl}/google`, payload, { withCredentials: true }).pipe(
      tap((res) => {
        if (res?.user) this.currentUserSubject.next(res.user);
        this.sessionCheck$ = of(!!res?.user);
        try { localStorage.setItem('sessionPresent', !!res?.user ? 'true' : 'false'); } catch (e) {}
      })
    );
  }

  // Método para registrar un nuevo usuario en la plataforma.
  // Envía los datos del formulario de registro al backend.
  // Si el registro es correcto, almacena el usuario autenticado en memoria.
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload, { withCredentials: true }).pipe(
      tap((res) => {
        if (res?.user) this.currentUserSubject.next(res.user);
        this.sessionCheck$ = of(!!res?.user);
        try { localStorage.setItem('sessionPresent', !!res?.user ? 'true' : 'false'); } catch (e) {}
      })
    );
  }

  // Método para cerrar la sesión del usuario.
  // Notifica al backend el cierre de sesión y limpia la sesión local.
  // No devuelve Observable porque la limpieza local se realiza directamente.
  logout(): void {
    console.log('[AuthService] logout() called');
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe();
    this.clearSession();
  }

  // Método para limpiar la información de sesión almacenada en el frontend.
  // Elimina el usuario cacheado y marca la sesión como no activa.
  // Se utiliza al cerrar sesión o cuando una comprobación de sesión falla.
  clearSession(): void {
    console.log('[AuthService] clearSession() called');
    this.currentUserSubject.next(null);
    this.sessionCheck$ = of(false);
    try { localStorage.setItem('sessionPresent', 'false'); } catch (e) {}
  }

  // Método para actualizar los datos del perfil del usuario autenticado.
  // Envía la información modificada al backend mediante una petición PUT.
  // Al recibir la respuesta, actualiza el usuario cacheado en memoria.
  updateProfile(payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, payload, { withCredentials: true }).pipe(
      tap((user) => this.currentUserSubject.next(user))
    );
  }

  // Método para comprobar si existe una sesión activa.
  // Usa primero la cache y localStorage para evitar llamadas innecesarias.
  // Si hay indicios de sesión, valida el estado real consultando el perfil en el backend.
  isLoggedIn$(): Observable<boolean> {
    // Devuelve el estado de sesión cacheado si ya se ha comprobado previamente.
    if (this.sessionCheck$) {
      console.log('[AuthService] isLoggedIn$() returning cached sessionCheck$');
      return this.sessionCheck$;
    }

    // Comprueba si existe una marca local de sesión activa.
    let recorded = false;
    try { recorded = localStorage.getItem('sessionPresent') === 'true'; } catch (e) { recorded = false; }
    console.log('[AuthService] isLoggedIn$() - sessionPresent flag:', recorded);
    
    // Si no hay sesión registrada localmente, se evita consultar al backend.
    if (!recorded) {
      console.log('[AuthService] isLoggedIn$() returning false (no sessionPresent flag)');
      this.sessionCheck$ = of(false);
      return this.sessionCheck$;
    }

    // Si hay sesión registrada, se valida con el backend obteniendo el perfil.
    console.log('[AuthService] isLoggedIn$() calling getProfile()...');
    this.sessionCheck$ = this.getProfile().pipe(
      map(() => {
        console.log('[AuthService] isLoggedIn$() getProfile succeeded, returning true');
        return true;
      }),
      catchError(() => {
        console.log('[AuthService] isLoggedIn$() getProfile failed, clearing session');
        this.currentUserSubject.next(null);
        try { localStorage.setItem('sessionPresent', 'false'); } catch (e) {}
        return of(false);
      }),
      take(1),
      defaultIfEmpty(false),
      shareReplay(1)
    );
    return this.sessionCheck$;
  }

  // Método para obtener el usuario almacenado actualmente en memoria.
  // Puede devolver null si todavía no se ha cargado el perfil.
  // Es útil para acceder rápidamente a los datos del usuario desde otros componentes.
  getCurrentUser(): any {
    return this.currentUserSubject.getValue();
  }

  // Método para obtener recomendaciones personalizadas para el usuario.
  // Permite indicar un límite de resultados mediante parámetro.
  // La petición se realiza manteniendo las credenciales de sesión.
  getRecommendations(limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/recommendations`, {
      params: { limit: limit.toString() },
      withCredentials: true
    });
  }

  // Método para obtener el historial del usuario autenticado.
  // Recupera la información asociada a su actividad previa.
  // La petición se realiza contra el endpoint de historial del backend.
  getHistory(): Observable<any> {
    return this.http.get(`${this.apiUrl}/history`, { withCredentials: true });
  }

  // Método para obtener los eventos a los que asiste el usuario.
  // Consulta en el backend la lista de eventos asociados al usuario autenticado.
  // Mantiene las credenciales para identificar correctamente la sesión.
  getAttending(): Observable<any> {
    return this.http.get(`${this.apiUrl}/attending`, { withCredentials: true });
  }

  // Método para solicitar la recuperación de contraseña.
  // Envía el correo electrónico del usuario al backend.
  // El backend se encarga de generar el proceso de restablecimiento.
  forgotPassword(email: string) {
    return this.rawHttp.post<{ message: string }>(
      `${this.apiUrl}/forgot-password`,
      { email }
    );
  }

  // Método para restablecer la contraseña del usuario.
  // Envía el token de recuperación y la nueva contraseña al backend.
  // Devuelve un mensaje indicando el resultado de la operación.
  resetPassword(token: string, password: string) {
    return this.rawHttp.post<{ message: string }>(
      `${this.apiUrl}/reset-password`,
      { token, password }
    );
  }
}