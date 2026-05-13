/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin.service.ts
 * Descripción: Servicio para la gestión de la administración.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces para las respuestas de la API. 
// Estas interfaces definen la estructura de los datos que se esperan recibir del backend para cada endpoint relacionado con la administración.

// Interface para representar las estadísticas generales del dashboard de administración, incluyendo el número total de usuarios, 
// eventos activos y registros totales.
export interface AdminDashboardStats {
  totalUsers: number;
  activeEvents: number;
  totalRegistrations: number;
}

// Interface para representar un evento en el dashboard de administración, incluyendo su ID, nombre, fecha, estado y número de inscritos.
export interface AdminDashboardEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  enrolled: number;
}

// Interface para representar los datos de actividad en el dashboard de administración, incluyendo etiquetas para el eje X 
// y datos para inscripciones a eventos, registros de usuarios y reportes presentados.
export interface AdminActivityData {
  labels: string[];
  eventSignups: number[];
  userRegistrations: number[];
  reportsFiled: number[];
}

// Interface para representar la respuesta del endpoint del dashboard de administración, que incluye estadísticas generales, 
// una lista de eventos próximos y datos de actividad.
export interface AdminDashboardResponse {
  stats: AdminDashboardStats;
  upcomingEvents: AdminDashboardEvent[];
  activityData: AdminActivityData;
}

// Interface para representar un usuario en la lista de usuarios del dashboard de administración, incluyendo su ID, nombre, 
// correo electrónico, rol, estado de bloqueo y fecha de creación.
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: string;
}

// Interface para representar los detalles de un usuario en el dashboard de administración, incluyendo su ID, nombre, correo electrónico, 
// nombre de usuario, rol, estado de bloqueo, biografía, ubicación, URL del avatar y fecha de creación.  
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

// Interface para representar la respuesta del endpoint de detalles de usuario en el dashboard de administración, 
// que incluye un objeto con los detalles del usuario.
export interface AdminUserDetailResponse {
  user: AdminUserDetail;
}

// Interface para representar la respuesta del endpoint de lista de usuarios en el dashboard de administración, 
// que incluye un array de objetos con información básica de cada usuario.
export interface AdminUsersResponse {
  users: AdminUser[];
}

// Interface para representar un evento en la lista de eventos del dashboard de administración, incluyendo su ID, nombre, 
// fecha, estado, número de inscritos y categoría.
export interface AdminEvent {
  id: string;
  name: string;
  date: string;
  status: string;
  enrolled: number;
  category: string;
}

// Interface para representar la respuesta del endpoint de lista de eventos en el dashboard de administración, 
// que incluye un array de objetos con información básica de cada evento.
export interface AdminEventsResponse {
  events: AdminEvent[];
}

// Interface para representar los detalles de un evento en el dashboard de administración, incluyendo su ID, título, descripción, categoría, 
// fechas de inicio y fin, ubicación, dirección, URL de la imagen, estado, número de inscritos y si es gratuito o no.
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

// Interface para representar la respuesta del endpoint de detalles de evento en el dashboard de administración, 
// que incluye un objeto con los detalles del evento.
export interface AdminEventDetailResponse {
  event: AdminEventDetail;
}

// Interface para representar un reporte en la lista de reportes del dashboard de administración, incluyendo su ID, tipo, 
// usuario involucrado, descripción, usuario que reportó, razón, fecha, categoría y estado.
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

// Interface para representar los detalles de un reporte en el dashboard de administración, incluyendo su ID, tipo, usuario involucrado, 
// descripción, usuario que reportó, razón, categoría, estado, resolución, usuario que resolvió, fechas de creación y resolución, 
// así como información detallada del usuario involucrado como su ID, nombre de usuario, correo electrónico, rol, estado de bloqueo y fecha de creación.
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

// Interface para representar la respuesta del endpoint de detalles de reporte en el dashboard de administración, 
// que incluye un objeto con los detalles del reporte.
export interface AdminReportDetailResponse {
  report: AdminReportDetail;
}

// Interface para representar la respuesta del endpoint de lista de reportes en el dashboard de administración, 
// que incluye un array de objetos con información básica de cada reporte.
export interface AdminReportsResponse {
  reports: AdminReport[];
}

// Interface para representar el resumen de reportes en el dashboard de administración, incluyendo el número total de reportes, 
// así como el número de reportes por categoría (contenido, usuarios y eventos).
export interface AdminReportsSummary {
  totalReports: number;
  contentReports: number;
  userReports: number;
  eventReports: number;
}

// Interface para representar la respuesta del endpoint de resumen de reportes en el dashboard de administración, 
// que incluye un objeto con el resumen de reportes.
export interface AdminReportsSummaryResponse {
  summary: AdminReportsSummary;
}

// Interface para representar la configuración general, de moderación, notificaciones, backup y mantenimiento en el dashboard de administración.
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

// Interface para representar la respuesta del endpoint de configuración en el dashboard de administración, 
// que incluye un objeto con la configuración general, de moderación, notificaciones, backup y mantenimiento.
export interface AdminSettingsResponse {
  settings: AdminSettings;
}

// Interface para representar el estado del sistema en el dashboard de administración, incluyendo si el sistema está operativo, 
// la carga del sistema, fechas de última actualización y backup, próxima fecha de backup, frecuencia de backup y fecha de última actualización.
export interface AdminSystemStatus {
  isOperational: boolean;
  systemLoad: string;
  lastUpdate: string;
  lastBackup: string;
  nextBackup: string;
  backupFrequency: string;
  lastUpdateDate: string;
}

// Interface para representar la respuesta del endpoint de estado del sistema en el dashboard de administración, 
// que incluye un objeto con el estado del sistema.
export interface AdminSystemStatusResponse {
  status: AdminSystemStatus;
}

// Servicio para la gestión de la administración en EventConnect. Este servicio proporciona métodos para interactuar 
// con los endpoints del backend relacionados con la administración, como obtener estadísticas del dashboard, gestionar usuarios, 
// eventos, reportes, configuraciones y estado del sistema. Todos los métodos incluyen la opción de enviar cookies para mantener la sesión de administrador.
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  // Métodos para interactuar con los endpoints del backend relacionados con la administración

  // Método para obtener las estadísticas del dashboard de administración, incluyendo estadísticas generales, eventos próximos y datos de actividad.
  getDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(`${this.apiUrl}/dashboard`, {
      withCredentials: true
    });
  }

  // Método para obtener la lista de usuarios registrados en la plataforma, incluyendo información básica de cada usuario.
  getUsers(): Observable<AdminUsersResponse> {
    return this.http.get<AdminUsersResponse>(`${this.apiUrl}/users`, {
      withCredentials: true
    });
  }

  // Método para obtener los detalles de un usuario específico, incluyendo información detallada del usuario como su biografía, ubicación y URL del avatar.
  getUserDetail(id: string): Observable<AdminUserDetailResponse> {
    return this.http.get<AdminUserDetailResponse>(`${this.apiUrl}/users/${id}`, {
      withCredentials: true
    });
  }

  // Método para bloquear a un usuario específico, lo que impide que el usuario acceda a su cuenta y utilice la plataforma.
  blockUser(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/block`, {}, {
      withCredentials: true
    });
  }

  // Método para desbloquear a un usuario específico, permitiéndole acceder a su cuenta y utilizar la plataforma.
  unblockUser(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/unblock`, {}, {
      withCredentials: true
    });
  }

  // Método para eliminar a un usuario específico de la plataforma.
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, {
      withCredentials: true
    });
  }

  // Método para obtener la lista de eventos en la plataforma, incluyendo información básica de cada evento.
  getEvents(): Observable<AdminEventsResponse> {
    return this.http.get<AdminEventsResponse>(`${this.apiUrl}/events`, {
      withCredentials: true
    });
  }

  // Método para obtener los detalles de un evento específico, incluyendo información detallada del evento como su descripción, ubicación y número de inscritos.
  getEventDetail(id: string): Observable<AdminEventDetailResponse> {
    return this.http.get<AdminEventDetailResponse>(`${this.apiUrl}/events/${id}`, {
      withCredentials: true
    });
  }

  // Método para crear un nuevo evento en la plataforma, enviando los datos del evento al backend.
  createEvent(event: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/events`, event, {
      withCredentials: true
    });
  }

  // Método para actualizar un evento existente en la plataforma, enviando los datos actualizados del evento al backend.
  updateEvent(id: string, event: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/events/${id}`, event, {
      withCredentials: true
    });
  }

  // Método para eliminar un evento específico de la plataforma.
  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${id}`, {
      withCredentials: true
    });
  }

  // Método para obtener un resumen de los reportes en la plataforma, incluyendo estadísticas generales y datos de actividad.
  getReportsSummary(): Observable<AdminReportsSummaryResponse> {
    return this.http.get<AdminReportsSummaryResponse>(`${this.apiUrl}/reports/summary`, {
      withCredentials: true
    });
  }

  // Método para obtener la lista de reportes en la plataforma, con la opción de filtrar por categoría.
  getReports(category?: string): Observable<AdminReportsResponse> {
    const url = category 
      ? `${this.apiUrl}/reports?category=${category}` 
      : `${this.apiUrl}/reports`;
    
    return this.http.get<AdminReportsResponse>(url, {
      withCredentials: true
    });
  }

  // Método para obtener los detalles de un reporte específico.
  getReportDetail(id: string): Observable<AdminReportDetailResponse> {
    return this.http.get<AdminReportDetailResponse>(`${this.apiUrl}/reports/${id}`, {
      withCredentials: true
    });
  }

  // Método para resolver un reporte específico, aplicando la resolución y la acción correspondiente.
  resolveReport(id: string, resolution: string, action?: 'ban' | 'none'): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/${id}/resolve`, 
      { resolution, action: action || 'none' },
      { withCredentials: true }
    );
  }

  // Método para rechazar un reporte específico, proporcionando una razón para el rechazo.
  rejectReport(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/${id}/reject`,
      { reason },
      { withCredentials: true }
    );
  }

  // Método para marcar un reporte específico como en revisión.
  markReportUnderReview(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/${id}/review`, {},
      { withCredentials: true }
    );
  }

  // Método para obtener la configuración de la plataforma.
  getSettings(): Observable<AdminSettingsResponse> {
    return this.http.get<AdminSettingsResponse>(`${this.apiUrl}/settings`, {
      withCredentials: true
    });
  }

  // Método para actualizar la configuración general de la plataforma.
  updateGeneralSettings(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings/general`, data, {
      withCredentials: true
    });
  }

  // Método para actualizar la configuración de moderación de la plataforma.
  updateModerationSettings(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings/moderation`, data, {
      withCredentials: true
    });
  }

  // Método para actualizar la configuración de notificaciones de la plataforma.
  updateNotificationSettings(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings/notifications`, data, {
      withCredentials: true
    });
  }

  // Método para obtener el estado del sistema.
  getSystemStatus(): Observable<AdminSystemStatusResponse> {
    return this.http.get<AdminSystemStatusResponse>(`${this.apiUrl}/system/status`, {
      withCredentials: true
    });
  }

  // Método para limpiar la caché del sistema.
  clearCache(): Observable<any> {
    return this.http.post(`${this.apiUrl}/system/cache`, {}, {
      withCredentials: true
    });
  }

  // Método para optimizar la base de datos del sistema.
  optimizeDatabase(): Observable<any> {
    return this.http.post(`${this.apiUrl}/system/optimize`, {}, {
      withCredentials: true
    });
  }

  // Método para descargar una copia de seguridad del sistema.
  downloadBackup(): Observable<any> {
    return this.http.post(`${this.apiUrl}/backup`, {}, {
      withCredentials: true
    });
  }
}
