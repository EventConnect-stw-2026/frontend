/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: chat.service.ts
 * Descripción: Servicio para la gestión de conversaciones y mensajes privados entre usuarios.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

// Servicio para la gestión del sistema de chat de EventConnect.
// Permite crear conversaciones privadas, obtener mensajes,
// enviar mensajes y gestionar conversaciones no leídas.
@Injectable({
  providedIn: 'root'
})
export class ChatService {

  // Cliente HTTP utilizado para realizar peticiones al backend.
  private httpBackend = inject(HttpBackend);
  private http = new HttpClient(this.httpBackend);

  // URL base para todos los endpoints relacionados con el chat.
  private baseUrl = `${environment.apiUrl}/chat`;

  // Método para crear una nueva conversación con un amigo
  // o recuperar una conversación ya existente.
  // Devuelve la información de la conversación obtenida.
  createOrGetConversation(friendId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/conversations/${friendId}`,
      {},
      { withCredentials: true }
    );
  }

  // Método para obtener todas las conversaciones
  // del usuario autenticado.
  // Devuelve la lista completa de chats disponibles.
  getMyConversations(): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/conversations`,
      { withCredentials: true }
    );
  }

  // Método para obtener todos los mensajes
  // de una conversación concreta.
  // Recibe el identificador de la conversación.
  getConversationMessages(conversationId: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { withCredentials: true }
    );
  }

  // Método para enviar un mensaje dentro de una conversación.
  // Envía el contenido del mensaje al backend.
  // Devuelve la respuesta generada tras el envío.
  sendMessage(conversationId: string, content: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { content },
      { withCredentials: true }
    );
  }

  // Método para marcar una conversación como leída.
  // Actualiza el estado de lectura en el backend.
  // Se utiliza para eliminar notificaciones pendientes.
  markConversationAsRead(conversationId: string): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}/conversations/${conversationId}/read`,
      {},
      { withCredentials: true }
    );
  }

  // Método para obtener el número de mensajes no leídos
  // agrupados por cada amigo o conversación.
  // Devuelve un objeto con el contador correspondiente.
  getUnreadCountsByFriend() {
    return this.http.get<{ unreadMessagesByFriend: Record<string, number> }>(
      `${this.baseUrl}/unread-counts-by-friend`,
      { withCredentials: true }
    );
  }
}