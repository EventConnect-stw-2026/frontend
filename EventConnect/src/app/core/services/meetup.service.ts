/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: meetup.service.ts
 * Descripción: Servicio para la gestión de quedadas entre usuarios.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Servicio encargado de gestionar las quedadas organizadas
// entre usuarios de la plataforma.
// Permite crear quedadas, responder invitaciones,
// cancelar encuentros y consultar invitaciones pendientes.
@Injectable({
  providedIn: 'root'
})
export class MeetupService {

  // Cliente HTTP utilizado para comunicarse con el backend.
  private httpBackend = inject(HttpBackend);
  private http = new HttpClient(this.httpBackend);

  // URL base de los endpoints relacionados con quedadas.
  private apiUrl = `${environment.apiUrl}/meetups`;

  // Método para crear una nueva quedada.
  // Recibe la información del evento, participantes, fecha y lugar.
  // Devuelve los datos de la quedada creada correctamente.
  createMeetup(payload: {
    eventId: string;
    friendIds: string[];
    meetupDateTime: string;
    meetupPlace: string;
  }) {
    return this.http.post<{ message: string; meetup: any }>(
      this.apiUrl,
      payload,
      { withCredentials: true }
    );
  }

  // Método para obtener las quedadas organizadas por el usuario.
  // Recupera todas las quedadas creadas por el usuario autenticado.
  // Devuelve una lista con las quedadas organizadas.
  getOrganizedMeetups() {
    return this.http.get<{ meetups: any[] }>(
      `${this.apiUrl}/organized`,
      { withCredentials: true }
    );
  }

  // Método para obtener las quedadas a las que el usuario ha sido invitado.
  // Recupera las invitaciones pendientes o respondidas.
  // Devuelve la lista de quedadas invitadas.
  getInvitedMeetups() {
    return this.http.get<{ meetups: any[] }>(
      `${this.apiUrl}/invited`,
      { withCredentials: true }
    );
  }

  // Método para responder a una invitación de quedada.
  // Permite aceptar o rechazar la invitación recibida.
  // Actualiza el estado de participación en el backend.
  respondToMeetup(meetupId: string, response: 'accepted' | 'rejected') {
    return this.http.put<{ message: string; meetup: any }>(
      `${this.apiUrl}/${meetupId}/respond`,
      { response },
      { withCredentials: true }
    );
  }

  // Método para cancelar una quedada organizada.
  // Recibe el identificador de la quedada que se desea cancelar.
  // Devuelve un mensaje indicando el resultado de la operación.
  cancelMeetup(meetupId: string) {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/${meetupId}/cancel`,
      {},
      { withCredentials: true }
    );
  }

  // Método para obtener el número de invitaciones pendientes.
  // Devuelve tanto el contador como un indicador booleano.
  // Se utiliza principalmente para mostrar notificaciones en la interfaz.
  getPendingInvitationsCount() {
    return this.http.get<{
      pendingInvitationsCount: number;
      hasPendingMeetupInvitations: boolean;
    }>(
      `${this.apiUrl}/pending-invitations-count`,
      { withCredentials: true }
    );
  }
}