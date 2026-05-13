/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: report.service.ts
 * Descripción: Servicio para la gestión de reportes realizados por los usuarios.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Servicio encargado de gestionar los reportes dentro de la plataforma.
// Permite crear nuevos reportes y consultar los reportes
// realizados por el usuario autenticado.
@Injectable({ providedIn: 'root' })
export class ReportService {

  // Cliente HTTP utilizado para realizar peticiones al backend.
  private http = inject(HttpClient);

  // URL base de los endpoints relacionados con reportes.
  private apiUrl = `${environment.apiUrl}/reports`;

  // Método para crear un nuevo reporte en la plataforma.
  // Envía al backend la información asociada al reporte.
  // La operación requiere que el usuario esté autenticado.
  createReport(payload: any): Observable<any> {
    return this.http.post(this.apiUrl, payload, { withCredentials: true });
  }

  // Método para obtener los reportes realizados por el usuario.
  // Recupera la lista de reportes asociados al usuario autenticado.
  // Mantiene las credenciales de sesión durante la petición.
  getMyReports(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my`, { withCredentials: true });
  }
}