/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event-chat.service.ts
 * Descripción: Servicio para la gestión del chat asociado a eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Servicio para la gestión de mensajes dentro de un evento.
// Permite consultar mensajes, enviar nuevos mensajes
// y obtener amigos que también asisten al evento.
@Injectable({
  providedIn: 'root'
})
export class EventChatService {

  // Cliente HTTP utilizado para comunicarse con el backend.
  private http = inject(HttpClient);

  // URL base de los endpoints relacionados con el chat de eventos.
  private apiUrl = environment.apiUrl + '/event-chat';

  // Método para obtener los mensajes de un evento concreto.
  // Recibe el identificador del evento como parámetro.
  // Devuelve la lista de mensajes asociados a ese evento.
  getMessages(eventId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${eventId}/messages`);
  }

  // Método para enviar un nuevo mensaje al chat de un evento.
  // Envía el contenido del mensaje al backend.
  // Mantiene las credenciales de sesión del usuario autenticado.
  sendMessage(eventId: string, content: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${eventId}/messages`,
      { content },
      { withCredentials: true }
    );
  }

  // Método para obtener los amigos que asisten a un evento.
  // Recibe el identificador del evento como parámetro.
  // Devuelve la lista de amigos relacionados con dicho evento.
  getFriendsAttending(eventId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/${eventId}/friends`,
      { withCredentials: true }
    );
  }
}