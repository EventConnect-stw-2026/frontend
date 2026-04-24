import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map, catchError, take, defaultIfEmpty } from 'rxjs/operators';
import { of } from 'rxjs';


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

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, { withCredentials: true }).pipe(
      tap((user) => this.currentUserSubject.next(user))
    );
  }

  refresh(): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh`, {}, { withCredentials: true });
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.rawHttp.post<AuthResponse>(`${this.apiUrl}/login`, payload, { withCredentials: true }).pipe(
      tap((res) => { if (res?.user) this.currentUserSubject.next(res.user); })
    );
  }

  loginWithGoogle(payload: GoogleLoginPayload): Observable<AuthResponse> {
    return this.rawHttp.post<AuthResponse>(`${this.apiUrl}/google`, payload, { withCredentials: true }).pipe(
      tap((res) => { if (res?.user) this.currentUserSubject.next(res.user); })
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload, { withCredentials: true }).pipe(
      tap((res) => { if (res?.user) this.currentUserSubject.next(res.user); })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe();
    this.currentUserSubject.next(null);
  }

  updateProfile(payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, payload, { withCredentials: true }).pipe(
      tap((user) => this.currentUserSubject.next(user))
    );
  }

  isLoggedIn$(): Observable<boolean> {
    return this.getProfile().pipe(
      map(() => true),
      catchError(() => of(false)),
      take(1),
      defaultIfEmpty(false)
    );
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