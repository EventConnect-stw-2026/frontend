import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map, catchError, take, defaultIfEmpty } from 'rxjs/operators';
import { of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';


interface LoginPayload {
  email: string;
  password: string;
}

interface GoogleLoginPayload {
  token: string;
  isRegistering?: boolean;
}

interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private httpBackend = inject(HttpBackend);
  private rawHttp = new HttpClient(this.httpBackend);
  private apiUrl = environment.apiUrl + '/auth';

  // Cache del usuario autenticado
  private currentUserSubject = new BehaviorSubject<any>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();
  private sessionCheck$: Observable<boolean> | null = null;

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

  refresh(): Observable<any> {
    console.log('[AuthService] refresh() called');
    return this.http.post(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap(() => {
        console.log('[AuthService] refresh() successful');
        try { localStorage.setItem('sessionPresent', 'true'); } catch (e) {}
      })
    );
  }

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

  loginWithGoogle(payload: GoogleLoginPayload): Observable<AuthResponse> {
    return this.rawHttp.post<AuthResponse>(`${this.apiUrl}/google`, payload, { withCredentials: true }).pipe(
      tap((res) => {
        if (res?.user) this.currentUserSubject.next(res.user);
        this.sessionCheck$ = of(!!res?.user);
        try { localStorage.setItem('sessionPresent', !!res?.user ? 'true' : 'false'); } catch (e) {}
      })
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload, { withCredentials: true }).pipe(
      tap((res) => {
        if (res?.user) this.currentUserSubject.next(res.user);
        this.sessionCheck$ = of(!!res?.user);
        try { localStorage.setItem('sessionPresent', !!res?.user ? 'true' : 'false'); } catch (e) {}
      })
    );
  }

  logout(): void {
    console.log('[AuthService] logout() called');
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe();
    this.clearSession();
  }

  clearSession(): void {
    console.log('[AuthService] clearSession() called');
    this.currentUserSubject.next(null);
    this.sessionCheck$ = of(false);
    try { localStorage.setItem('sessionPresent', 'false'); } catch (e) {}
  }

  updateProfile(payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, payload, { withCredentials: true }).pipe(
      tap((user) => this.currentUserSubject.next(user))
    );
  }

  isLoggedIn$(): Observable<boolean> {
    // Return cached session state if available
    if (this.sessionCheck$) {
      console.log('[AuthService] isLoggedIn$() returning cached sessionCheck$');
      return this.sessionCheck$;
    }

    // Check localStorage flag to minimize unnecessary profile calls
    let recorded = false;
    try { recorded = localStorage.getItem('sessionPresent') === 'true'; } catch (e) { recorded = false; }
    console.log('[AuthService] isLoggedIn$() - sessionPresent flag:', recorded);
    
    // Fast-path: if session not recorded locally, don't check server
    // This prevents loading stale session data from persistent cookies
    if (!recorded) {
      console.log('[AuthService] isLoggedIn$() returning false (no sessionPresent flag)');
      this.sessionCheck$ = of(false);
      return this.sessionCheck$;
    }

    // Session was recorded, verify it's still valid on the server
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

  // Devuelve el usuario cacheado en memoria (puede ser null si aún no se ha cargado)
  getCurrentUser(): any {
    return this.currentUserSubject.getValue();
  }

  getRecommendations(limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/recommendations`, {
      params: { limit: limit.toString() },
      withCredentials: true
    });
  }

  getHistory(): Observable<any> {
    return this.http.get(`${this.apiUrl}/history`, { withCredentials: true });
  }

  getAttending(): Observable<any> {
    return this.http.get(`${this.apiUrl}/attending`, { withCredentials: true });
  }

  forgotPassword(email: string) {
    return this.rawHttp.post<{ message: string }>(
      `${this.apiUrl}/forgot-password`,
      { email }
    );
  }

  resetPassword(token: string, password: string) {
    return this.rawHttp.post<{ message: string }>(
      `${this.apiUrl}/reset-password`,
      { token, password }
    );
  }
}