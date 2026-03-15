import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private apiUrl = environment.apiUrl + '/auth';

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, { withCredentials: true });
  }
  refresh(): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh`, {}, { withCredentials: true });
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload, { withCredentials: true });
  }

  loginWithGoogle(payload: GoogleLoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, payload, { withCredentials: true });
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload, { withCredentials: true });
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe();
  }

  isLoggedIn$(): Observable<boolean> {
    return this.getProfile().pipe(
      map(() => true),
      catchError(() => of(false)),
      take(1),
      // Si no hay ningún valor, emitir false
      defaultIfEmpty(false)
    );
  }

  getCurrentUser() {
    // Se puede obtener el usuario desde el backend si es necesario
    return null;
  }
}