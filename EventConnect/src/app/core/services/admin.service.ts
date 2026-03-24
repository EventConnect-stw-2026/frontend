import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminDashboardStats {
  totalUsers: number;
  activeEvents: number;
  pendingModeration: number;
  totalRegistrations: number;
}

export interface AdminDashboardEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  enrolled: number;
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats;
  upcomingEvents: AdminDashboardEvent[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  getDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(`${this.apiUrl}/dashboard`, {
      withCredentials: true
    });
  }

  getUsers(): Observable<AdminUsersResponse> {
    return this.http.get<AdminUsersResponse>(`${this.apiUrl}/users`, {
      withCredentials: true
    });
  }
}
