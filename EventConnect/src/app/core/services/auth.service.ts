import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';


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

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((response) => this.saveAuthData(response))
    );
  }

  loginWithGoogle(payload: GoogleLoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, payload).pipe(
      tap((response) => this.saveAuthData(response))
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((response) => this.saveAuthData(response))
    );
  }

  logout(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser()) return false;
    return !!this.getToken();
  }

  getCurrentUser() {
    if (!this.isBrowser()) return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  private saveAuthData(response: AuthResponse): void {
    if (!this.isBrowser()) return;
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }
}