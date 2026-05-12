/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: friends.service.ts
 * Descripción: Servicio para la gestión de amistades y solicitudes de amistad.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Servicio encargado de gestionar todas las operaciones
// relacionadas con amistades entre usuarios.
// Permite enviar solicitudes, aceptarlas, rechazarlas,
// consultar amigos y buscar usuarios.
@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  // Cliente HTTP utilizado para comunicarse con el backend.
  private httpBackend = inject(HttpBackend);
  private http = new HttpClient(this.httpBackend);

  // URL base de los endpoints relacionados con amistades.
  private apiUrl = `${environment.apiUrl}/friends`;

  // Método para enviar una solicitud de amistad a otro usuario.
  // Recibe el identificador del usuario destinatario.
  // Devuelve un mensaje indicando el resultado de la operación.
  sendFriendRequest(friendId: string) {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/request`,
      { friendId },
      { withCredentials: true }
    );
  }

  // Método para aceptar una solicitud de amistad pendiente.
  // Recibe el identificador de la solicitud enviada por el backend.
  // Devuelve un mensaje confirmando la aceptación.
  acceptFriendRequest(requestId: string) {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/${requestId}/accept`,
      {},
      { withCredentials: true }
    );
  }

  // Método para rechazar una solicitud de amistad.
  // Actualiza el estado de la solicitud en el backend.
  // Devuelve un mensaje indicando el resultado de la operación.
  rejectFriendRequest(requestId: string) {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/${requestId}/reject`,
      {},
      { withCredentials: true }
    );
  }

  // Método para obtener las solicitudes de amistad pendientes.
  // Recupera todas las solicitudes recibidas por el usuario autenticado.
  // Devuelve una lista de solicitudes pendientes.
  getPendingRequests() {
    return this.http.get<{ pendingRequests: any[] }>(
      `${this.apiUrl}/pending`,
      { withCredentials: true }
    );
  }

  // Método para obtener la lista de amigos del usuario.
  // Devuelve tanto la lista de amigos como el número total.
  // La petición requiere mantener la sesión autenticada.
  getFriends() {
    return this.http.get<{ friends: any[], count: number }>(
      `${this.apiUrl}/list`,
      { withCredentials: true }
    );
  }

  // Método para eliminar un amigo de la lista de amistades.
  // Recibe el identificador del amigo que se desea eliminar.
  // Devuelve un mensaje indicando el resultado de la operación.
  removeFriend(friendId: string) {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${friendId}`,
      { withCredentials: true }
    );
  }

  // Método para obtener todos los usuarios disponibles para búsqueda.
  // Recupera una lista de usuarios visibles para el sistema de amistades.
  // Se utiliza principalmente para búsquedas y sugerencias.
  getAllUsers() {
    return this.http.get<{ users: any[] }>(
      `${this.apiUrl}/searchable`,
      { withCredentials: true }
    );
  }

  // Método para obtener sugerencias de amistad.
  // Devuelve usuarios recomendados en función de distintos criterios.
  // La lógica de recomendación se gestiona en el backend.
  getSuggestedFriends() {
    return this.http.get<{ suggestedFriends: any[] }>(
      `${this.apiUrl}/suggested`,
      { withCredentials: true }
    );
  }

  // Método para buscar usuarios mediante texto.
  // Recibe una cadena de búsqueda y la envía codificada al backend.
  // Devuelve una lista de usuarios coincidentes.
  searchUsers(query: string) {
    return this.http.get<{ users: any[] }>(
      `${this.apiUrl}/search?q=${encodeURIComponent(query)}`,
      { withCredentials: true }
    );
  }

  // Método para obtener las solicitudes de amistad enviadas.
  // Recupera las solicitudes pendientes que el usuario ha enviado.
  // Devuelve la lista de solicitudes realizadas.
  getSentRequests() {
    return this.http.get<{ sentRequests: any[] }>(
      `${this.apiUrl}/sent`,
      { withCredentials: true }
    );
  }
}