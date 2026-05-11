/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event.service.ts
 * Descripción: Servicio para la gestión y consulta de eventos de la plataforma.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Servicio encargado de gestionar las operaciones relacionadas
// con los eventos de la plataforma EventConnect.
// Permite consultar eventos, obtener estadísticas
// y gestionar la asistencia de usuarios a eventos.
@Injectable({
  providedIn: 'root'
})
export class EventService {

  // URL base de los endpoints relacionados con eventos.
  private apiUrl = 'http://localhost:3000/api/events';

  // Constructor del servicio que inyecta el cliente HTTP.
  constructor(private http: HttpClient) {}

  // Método para obtener la lista de eventos disponibles.
  // Permite aplicar paginación y distintos filtros de búsqueda.
  // Devuelve los eventos obtenidos desde el backend.
  getEvents(page = 1, limit = 15, filters: any = {}): Observable<any> {

    // Construcción de parámetros de consulta para paginación.
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    // Aplicación de filtros opcionales.
    if (filters.category) params = params.set('category', filters.category);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);

    // Petición HTTP para recuperar eventos filtrados.
    return this.http.get(this.apiUrl, { params });
  }

  // Método para obtener los detalles de un evento concreto.
  // Recibe el identificador del evento como parámetro.
  // Devuelve toda la información asociada al evento.
  getEventById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Método para obtener estadísticas globales de la plataforma.
  // Recupera datos generales relacionados con eventos y usuarios.
  // La información se obtiene desde el módulo de estadísticas.
  getGlobalStats(): Observable<any> {
    return this.http.get('http://localhost:3000/api/stats/global');
  }

  // Método para obtener estadísticas personales del usuario autenticado.
  // Incluye datos relacionados con su actividad en la plataforma.
  // Mantiene las credenciales de sesión durante la petición.
  getPersonalStats(): Observable<any> {
    return this.http.get('http://localhost:3000/api/stats/personal', { withCredentials: true });
  }

  // Método para alternar la asistencia del usuario a un evento.
  // Permite apuntarse o desapuntarse dependiendo del estado actual.
  // La operación requiere que el usuario esté autenticado.
  toggleAttend(eventId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${eventId}/attend`, 
      {},
      { withCredentials: true } 
    );
  }
}