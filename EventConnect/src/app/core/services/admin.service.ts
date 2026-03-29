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

export interface AdminEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  enrolled: number;
  category: string;
}

export interface AdminEventsResponse {
  events: AdminEvent[];
}

export interface AdminReport {
  id: string;
  type: string;
  involvedUser: string;
  involvedUsername: string;
  description: string;
  reportedBy: string;
  reason: string;
  date: string;
  category: 'Contenido' | 'Usuarios' | 'Eventos';
  status: string;
}

export interface AdminReportsResponse {
  reports: AdminReport[];
}

export interface AdminReportsSummary {
  totalReports: number;
  contentReports: number;
  userReports: number;
  eventReports: number;
}

export interface AdminReportsSummaryResponse {
  summary: AdminReportsSummary;
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

  getEvents(): Observable<AdminEventsResponse> {
    return this.http.get<AdminEventsResponse>(`${this.apiUrl}/events`, {
      withCredentials: true
    });
  }

  getReportsSummary(): Observable<AdminReportsSummaryResponse> {
    return this.http.get<AdminReportsSummaryResponse>(`${this.apiUrl}/reports/summary`, {
      withCredentials: true
    });
  }

  getReports(category?: string): Observable<AdminReportsResponse> {
    const url = category 
      ? `${this.apiUrl}/reports?category=${category}` 
      : `${this.apiUrl}/reports`;
    
    return this.http.get<AdminReportsResponse>(url, {
      withCredentials: true
    });
  }
}
