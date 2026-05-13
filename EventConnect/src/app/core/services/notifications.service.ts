/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: notifications.service.ts
 * Descripción: Servicio para la gestión de notificaciones globales de la aplicación.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { FriendsService } from './friends.service';
import { ChatService } from './chat.service';
import { MeetupService } from './meetup.service';
import { AuthService } from './auth.service';

// Servicio encargado de gestionar el estado global de las notificaciones.
// Centraliza las notificaciones de amistad, mensajes no leídos
// e invitaciones pendientes a quedadas.
@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  // Servicios utilizados para consultar datos de amistad, chat, quedadas y sesión.
  private friendsService = inject(FriendsService);
  private chatService = inject(ChatService);
  private meetupService = inject(MeetupService);
  private authService = inject(AuthService);

  // Estado interno que indica si existen notificaciones relacionadas con amigos o mensajes.
  private hasFriendsNotificationsSubject = new BehaviorSubject<boolean>(false);
  hasFriendsNotifications$ = this.hasFriendsNotificationsSubject.asObservable();

  // Estado interno que almacena si hay invitaciones pendientes a quedadas y su contador.
  private meetupInvitationsSubject = new BehaviorSubject<{
    hasPending: boolean;
    count: number;
  }>({
    hasPending: false,
    count: 0
  });
  meetupInvitations$ = this.meetupInvitationsSubject.asObservable();

  // Método para actualizar manualmente el estado de notificaciones de amigos.
  // Recibe un valor booleano que indica si existen notificaciones activas.
  // Notifica el nuevo estado a todos los componentes suscritos.
  setHasFriendsNotifications(value: boolean): void {
    this.hasFriendsNotificationsSubject.next(value);
  }

  // Método para actualizar el estado de invitaciones a quedadas.
  // Recibe si existen invitaciones pendientes y el número total.
  // Publica la información para que pueda mostrarse en la interfaz.
  setMeetupInvitations(data: { hasPending: boolean; count: number }): void {
    this.meetupInvitationsSubject.next(data);
  }

  // Método para limpiar todas las notificaciones globales.
  // Reinicia las notificaciones de amigos, mensajes y quedadas.
  // Se utiliza principalmente al cerrar sesión o perder la autenticación.
  clearNotifications(): void {
    this.setHasFriendsNotifications(false);
    this.setMeetupInvitations({ hasPending: false, count: 0 });
  }

  // Método para refrescar todas las notificaciones globales del usuario.
  // Consulta en paralelo solicitudes pendientes, mensajes no leídos e invitaciones.
  // Actualiza los estados internos según los datos obtenidos del backend.
  refreshAllFriendsNotifications(): void {

    // Si no hay usuario autenticado, se limpian las notificaciones.
    if (!this.authService.getCurrentUser()) {
      this.clearNotifications();
      return;
    }

    // Consulta paralela de todas las fuentes de notificaciones.
    forkJoin({
      pending: this.friendsService.getPendingRequests(),
      unread: this.chatService.getUnreadCountsByFriend(),
      meetupInvitations: this.meetupService.getPendingInvitationsCount()
    }).subscribe({
      next: ({ pending, unread, meetupInvitations }: any) => {

        // Número de solicitudes de amistad pendientes.
        const pendingCount = pending?.pendingRequests?.length || 0;

        // Cálculo del total de mensajes no leídos.
        const unreadMap = unread?.unreadMessagesByFriend || {};
        const unreadTotal = Object.values(unreadMap).reduce(
          (sum: number, count: any) => sum + Number(count || 0),
          0
        );

        // Información sobre invitaciones pendientes a quedadas.
        const meetupPending = meetupInvitations?.pendingInvitationsCount || 0;
        const hasMeetupPending = !!meetupInvitations?.hasPendingMeetupInvitations;

        // Actualización del estado específico de quedadas.
        this.setMeetupInvitations({
          hasPending: hasMeetupPending,
          count: meetupPending
        });

        // Activación de notificaciones globales si existe cualquier aviso pendiente.
        this.setHasFriendsNotifications(
          pendingCount > 0 || unreadTotal > 0 || meetupPending > 0
        );
      },
      error: (err) => {

        // Si la sesión ha caducado, se limpia el estado local.
        if (err?.status === 401) {
          this.clearNotifications();
          this.authService.clearSession();
          return;
        }

        // Registro del error para facilitar la depuración.
        console.error('Error al refrescar notificaciones globales:', err);
      }
    });
  }
}