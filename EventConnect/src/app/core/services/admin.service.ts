import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminDashboardStats {
  totalUsers: number;
  activeEvents: number;
  totalRegistrations: number;
}

export interface AdminDashboardEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  enrolled: number;
}

export interface AdminActivityData {
  labels: string[];
  eventSignups: number[];
  userRegistrations: number[];
  reportsFiled: number[];
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats;
  upcomingEvents: AdminDashboardEvent[];
  activityData: AdminActivityData;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  bio: string;
  location: string;
  avatarUrl: string;
  createdAt: string;
}

export interface AdminUserDetailResponse {
  user: AdminUserDetail;
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

export interface AdminEventDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  address: string;
  imageUrl: string;
  status: string;
  enrolled: number;
  isFree: boolean;
}

export interface AdminEventDetailResponse {
  event: AdminEventDetail;
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

export interface AdminReportDetail {
  id: string;
  type: string;
  involvedUser: string;
  involvedUserId: string;
  involvedUsername: string;
  involvedUserEmail: string;
  involvedUserRole: string;
  involvedUserBlocked: boolean;
  involvedUserCreatedAt: string;
  description: string;
  reportedBy: string;
  reportedByUsername: string;
  reason: string;
  reasonRaw: string;
  category: 'Contenido' | 'Usuarios' | 'Eventos';
  status: string;
  resolution: string | null;
  resolvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminReportDetailResponse {
  report: AdminReportDetail;
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

export interface AdminSettings {
  general: {
    appName: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    timezone: string;
    defaultLanguage: string;
  };
  moderation: {
    requireEventApproval: boolean;
    autoDetectWords: boolean;
    autoBanAfterReports: boolean;
    notifyModeratorsOnReports: boolean;
    bannedWords: string[];
  };
  notifications: {
    notifyReportedUsers: boolean;
    notifyFlaggedContent: boolean;
    weeklySummary: boolean;
    systemAlerts: boolean;
  };
  backup: any;
  maintenance: any;
}

export interface AdminSettingsResponse {
  settings: AdminSettings;
}

export interface AdminSystemStatus {
  isOperational: boolean;
  systemLoad: string;
  lastUpdate: string;
  lastBackup: string;
  nextBackup: string;
  backupFrequency: string;
  lastUpdateDate: string;
}

export interface AdminSystemStatusResponse {
  status: AdminSystemStatus;
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

  getUserDetail(id: string): Observable<AdminUserDetailResponse> {
    return this.http.get<AdminUserDetailResponse>(`${this.apiUrl}/users/${id}`, {
      withCredentials: true
    });
  }

  blockUser(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/block`, {}, {
      withCredentials: true
    });
  }

  unblockUser(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/unblock`, {}, {
      withCredentials: true
    });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, {
      withCredentials: true
    });
  }

  getEvents(): Observable<AdminEventsResponse> {
    return this.http.get<AdminEventsResponse>(`${this.apiUrl}/events`, {
      withCredentials: true
    });
  }

  getEventDetail(id: string): Observable<AdminEventDetailResponse> {
    return this.http.get<AdminEventDetailResponse>(`${this.apiUrl}/events/${id}`, {
      withCredentials: true
    });
  }

  createEvent(event: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/events`, event, {
      withCredentials: true
    });
  }

  updateEvent(id: string, event: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/events/${id}`, event, {
      withCredentials: true
    });
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${id}`, {
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

  getReportDetail(id: string): Observable<AdminReportDetailResponse> {
    return this.http.get<AdminReportDetailResponse>(`${this.apiUrl}/reports/${id}`, {
      withCredentials: true
    });
  }

  resolveReport(id: string, resolution: string, action?: 'ban' | 'none'): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/${id}/resolve`, 
      { resolution, action: action || 'none' },
      { withCredentials: true }
    );
  }

  rejectReport(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/${id}/reject`,
      { reason },
      { withCredentials: true }
    );
  }

  markReportUnderReview(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/${id}/review`, {},
      { withCredentials: true }
    );
  }

  getSettings(): Observable<AdminSettingsResponse> {
    return this.http.get<AdminSettingsResponse>(`${this.apiUrl}/settings`, {
      withCredentials: true
    });
  }

  updateGeneralSettings(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings/general`, data, {
      withCredentials: true
    });
  }

  updateModerationSettings(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings/moderation`, data, {
      withCredentials: true
    });
  }

  updateNotificationSettings(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings/notifications`, data, {
      withCredentials: true
    });
  }

  getSystemStatus(): Observable<AdminSystemStatusResponse> {
    return this.http.get<AdminSystemStatusResponse>(`${this.apiUrl}/system/status`, {
      withCredentials: true
    });
  }

  clearCache(): Observable<any> {
    return this.http.post(`${this.apiUrl}/system/cache`, {}, {
      withCredentials: true
    });
  }

  optimizeDatabase(): Observable<any> {
    return this.http.post(`${this.apiUrl}/system/optimize`, {}, {
      withCredentials: true
    });
  }

  downloadBackup(): Observable<any> {
    return this.http.post(`${this.apiUrl}/backup`, {}, {
      withCredentials: true
    });
  }
}
