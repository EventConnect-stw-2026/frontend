/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: friends.component.ts
 * Descripción: Componente encargado de gestionar la pantalla de amigos, incluyendo amistades,
 * solicitudes recibidas y enviadas, sugerencias, chats y notificaciones de quedadas.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { FriendsService } from '../../core/services/friends.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { HeaderComponent } from '../../layout/components/header/header';
import { NotificationsService } from '../../core/services/notifications.service';
import { MeetupService } from '../../core/services/meetup.service';

// Componente encargado de gestionar la red de amigos del usuario.
// Permite cargar amigos, aceptar o rechazar solicitudes,
// buscar nuevos usuarios, abrir chats y acceder a quedadas.
@Component({
  standalone: true,
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss',
  imports: [CommonModule, FormsModule, HeaderComponent]
})
export class FriendsComponent implements OnInit {

  // Servicio utilizado para consultar amigos, solicitudes y sugerencias.
  private friendsService = inject(FriendsService);

  // Servicio de autenticación utilizado para obtener el usuario actual.
  private authService = inject(AuthService);

  // Servicio utilizado para crear o recuperar conversaciones privadas.
  private chatService = inject(ChatService);

  // Servicio de navegación utilizado para cambiar de pantalla.
  private router = inject(Router);

  // Referencia para forzar la detección de cambios cuando se actualizan datos.
  private cdr = inject(ChangeDetectorRef);

  // Servicio global para actualizar indicadores de notificaciones.
  private notificationsService = inject(NotificationsService);

  // Servicio relacionado con quedadas e invitaciones entre amigos.
  private meetupService = inject(MeetupService);

  // Indica si existen invitaciones pendientes a quedadas.
  hasPendingMeetupInvitations = false;

  // Listado de amigos actuales del usuario.
  friends: any[] = [];

  // Solicitudes de amistad recibidas y pendientes de respuesta.
  pendingRequests: any[] = [];

  // Solicitudes de amistad enviadas por el usuario.
  sentRequests: any[] = [];

  // Usuarios sugeridos para ampliar la red de amigos.
  suggestedUsers: any[] = [];

  // Resultados de búsqueda usados en el modal de añadir amigo.
  allUsers: any[] = [];

  // Texto utilizado para filtrar los amigos actuales.
  searchTerm = '';

  // Texto introducido en el buscador del modal de añadir amigo.
  searchAddFriendTerm = '';

  // Indica si se está cargando el listado principal de amigos.
  isLoading = false;

  // Identificador del usuario autenticado.
  currentUserId = '';

  // Controla la visibilidad del modal de añadir amigo.
  showAddFriendModal = false;

  // Temporizador usado para aplicar debounce en la búsqueda de usuarios.
  searchTimeout: any;

  // Indica si se está realizando una búsqueda de usuarios.
  isSearchingUsers = false;

  // Controla la visibilidad del modal de confirmación de eliminación.
  showConfirmDelete = false;

  // Identificador del amigo seleccionado para eliminar.
  friendToDeleteId: string | null = null;

  // Nombre del amigo seleccionado para mostrarlo en el modal.
  friendToDeleteName = '';

  // Indica si el usuario ya ha empezado a escribir en el buscador del modal.
  typingStarted = false;

  // Conjuntos de control para evitar acciones duplicadas en solicitudes.
  sendingRequestIds = new Set<string>();
  acceptingRequestIds = new Set<string>();
  rejectingRequestIds = new Set<string>();
  removingFriendIds = new Set<string>();
  cancellingRequestIds = new Set<string>();
  openingChatIds = new Set<string>();

  // Mapa de mensajes no leídos agrupados por amigo.
  unreadMessagesByFriend: Record<string, number> = {};

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Obtiene el usuario actual, carga amigos, solicitudes, sugerencias y mensajes no leídos.
  // También se suscribe a las notificaciones de invitaciones a quedadas.
  ngOnInit(): void {
    const user = this.authService.getCurrentUser() as any;
    this.currentUserId = user?._id || '';

    this.loadFriends();
    this.loadPendingRequests();
    this.loadSentRequests();
    this.loadSuggestedUsers();
    this.loadUnreadMessages();

    this.notificationsService.meetupInvitations$.subscribe(data => {
      this.hasPendingMeetupInvitations = data?.hasPending || false;
      this.cdr.detectChanges();
    });

    this.notificationsService.refreshAllFriendsNotifications();
  }

  // Método privado para filtrar usuarios disponibles para enviar solicitud.
  // Excluye al usuario actual, a quienes ya son amigos
  // y a quienes ya han enviado una solicitud pendiente.
  private filterAvailableUsers(users: any[]): any[] {
    return users.filter((user: any) =>
      user._id !== this.currentUserId &&
      !this.friends.find(f => f._id === user._id) &&
      !this.pendingRequests.find(p => p.fromUser._id === user._id)
    );
  }

  // Método para cargar la lista de amigos del usuario.
  // Solicita los datos al backend y actualiza el estado de carga.
  // Si ocurre un error, se registra en consola y se desbloquea la interfaz.
  loadFriends(): void {
    this.isLoading = true;

    this.friendsService.getFriends().subscribe({
      next: (res) => {
        this.friends = res.friends;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar amigos:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Método para cargar las solicitudes de amistad recibidas.
  // Recupera las peticiones pendientes del backend.
  // Actualiza la vista para mostrar los botones de aceptar o rechazar.
  loadPendingRequests(): void {
    this.friendsService.getPendingRequests().subscribe({
      next: (res) => {
        this.pendingRequests = res.pendingRequests;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
      }
    });
  }

  // Método para cargar las solicitudes de amistad enviadas.
  // Permite mostrar aquellas solicitudes que siguen pendientes de respuesta.
  // Se usa también después de enviar una nueva solicitud.
  loadSentRequests(): void {
    this.friendsService.getSentRequests().subscribe({
      next: (res) => {
        this.sentRequests = res.sentRequests;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar solicitudes enviadas:', err);
      }
    });
  }

  // Método para cargar usuarios sugeridos como posibles amigos.
  // Solicita recomendaciones al backend.
  // Actualiza el panel de sugerencias de la vista.
  loadSuggestedUsers(): void {
    this.friendsService.getSuggestedFriends().subscribe({
      next: (res: any) => {
        this.suggestedUsers = res.suggestedFriends;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar usuarios sugeridos:', err);
      }
    });
  }

  // Método para cargar el número de mensajes no leídos por amigo.
  // Consulta el backend y guarda un mapa con el contador de cada usuario.
  // Si falla, limpia el mapa para evitar mostrar contadores antiguos.
  loadUnreadMessages(): void {
    this.chatService.getUnreadCountsByFriend().subscribe({
      next: (res: any) => {
        this.unreadMessagesByFriend = res?.unreadMessagesByFriend || {};
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar mensajes no leídos:', err);
        this.unreadMessagesByFriend = {};
        this.cdr.detectChanges();
      }
    });
  }

  // Método para refrescar las notificaciones globales del header.
  // Delega la actualización completa en el servicio de notificaciones.
  // Se usa tras cambios en solicitudes de amistad.
  refreshHeaderNotifications(): void {
    this.notificationsService.refreshAllFriendsNotifications();
  }

  // Método para enviar una solicitud de amistad.
  // Usa un Set inmutable para marcar el botón como cargando
  // y evitar envíos duplicados mientras termina la petición.
  sendFriendRequest(friendId: string): void {
    if (this.sendingRequestIds.has(friendId)) return;

    this.sendingRequestIds = new Set(this.sendingRequestIds).add(friendId);
    this.cdr.detectChanges();

    this.friendsService.sendFriendRequest(friendId)
      .pipe(
        finalize(() => {
          const next = new Set(this.sendingRequestIds);
          next.delete(friendId);
          this.sendingRequestIds = next;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.suggestedUsers = this.suggestedUsers.filter(u => u._id !== friendId);
          this.loadSentRequests();

          // Se marca el usuario como pendiente en el modal si aparece en los resultados.
          this.allUsers = this.allUsers.map(u =>
            u._id === friendId ? { ...u, requestSent: true } : u
          );

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al enviar solicitud:', err);
        }
      });
  }

  // Método para aceptar una solicitud de amistad recibida.
  // Bloquea temporalmente la acción para evitar dobles clics.
  // Al finalizar, recarga amigos, solicitudes y sugerencias.
  acceptRequest(requestId: string): void {
    if (this.acceptingRequestIds.has(requestId)) return;

    this.acceptingRequestIds = new Set(this.acceptingRequestIds).add(requestId);
    this.cdr.detectChanges();

    this.friendsService.acceptFriendRequest(requestId)
      .pipe(
        finalize(() => {
          const next = new Set(this.acceptingRequestIds);
          next.delete(requestId);
          this.acceptingRequestIds = next;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadFriends();
          this.loadPendingRequests();
          this.loadSuggestedUsers();
          this.refreshHeaderNotifications();
        },
        error: (err) => {
          console.error('Error al aceptar solicitud:', err);
        }
      });
  }

  // Método para rechazar una solicitud de amistad recibida.
  // Marca la solicitud como en proceso mientras se comunica con el backend.
  // Después refresca solicitudes pendientes y notificaciones del header.
  rejectRequest(requestId: string): void {
    if (this.rejectingRequestIds.has(requestId)) return;

    this.rejectingRequestIds = new Set(this.rejectingRequestIds).add(requestId);
    this.cdr.detectChanges();

    this.friendsService.rejectFriendRequest(requestId)
      .pipe(
        finalize(() => {
          const next = new Set(this.rejectingRequestIds);
          next.delete(requestId);
          this.rejectingRequestIds = next;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadPendingRequests();
          this.refreshHeaderNotifications();
        },
        error: (err) => {
          console.error('Error al rechazar solicitud:', err);
        }
      });
  }

  // Método para abrir el modal de confirmación de eliminación.
  // Guarda el id y nombre del amigo seleccionado.
  // Permite mostrar una confirmación antes de borrar la amistad.
  openDeleteConfirm(friendId: string, friendName: string): void {
    this.friendToDeleteId = friendId;
    this.friendToDeleteName = friendName;
    this.showConfirmDelete = true;
    this.cdr.detectChanges();
  }

  // Método para cerrar el modal de eliminación.
  // Limpia los datos temporales del amigo seleccionado.
  // Devuelve la interfaz a su estado normal.
  closeDeleteConfirm(): void {
    this.friendToDeleteId = null;
    this.friendToDeleteName = '';
    this.showConfirmDelete = false;
    this.cdr.detectChanges();
  }

  // Método para confirmar la eliminación de un amigo.
  // Evita acciones duplicadas y llama al backend para romper la amistad.
  // Después recarga amigos y sugerencias, y cierra el modal.
  confirmRemoveFriend(): void {
    if (!this.friendToDeleteId) return;
    if (this.removingFriendIds.has(this.friendToDeleteId)) return;

    const friendId = this.friendToDeleteId;
    this.removingFriendIds = new Set(this.removingFriendIds).add(friendId);
    this.cdr.detectChanges();

    this.friendsService.removeFriend(friendId)
      .pipe(
        finalize(() => {
          const next = new Set(this.removingFriendIds);
          next.delete(friendId);
          this.removingFriendIds = next;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadFriends();
          this.loadSuggestedUsers();
          this.closeDeleteConfirm();
        },
        error: (err) => {
          console.error('Error al eliminar amigo:', err);
          this.closeDeleteConfirm();
        }
      });
  }

  // Método para abrir un chat privado con un amigo.
  // Crea o recupera la conversación existente desde el backend.
  // Limpia el contador de no leídos y navega al detalle del chat.
  openChat(friendId: string): void {
    if (!friendId) return;
    if (this.openingChatIds.has(friendId)) return;

    this.openingChatIds = new Set(this.openingChatIds).add(friendId);
    this.cdr.detectChanges();

    this.chatService.createOrGetConversation(friendId)
      .pipe(
        finalize(() => {
          const next = new Set(this.openingChatIds);
          next.delete(friendId);
          this.openingChatIds = next;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          const conversationId = res?.conversation?._id;
          if (!conversationId) return;

          // Se limpia visualmente el contador del amigo al abrir la conversación.
          this.unreadMessagesByFriend = {
            ...this.unreadMessagesByFriend,
            [friendId]: 0
          };
          this.cdr.detectChanges();

          this.router.navigate(['/chat', conversationId]);
        },
        error: (err) => {
          console.error('Error al abrir chat:', err);
        }
      });
  }

  // Getter que devuelve los amigos filtrados por nombre o usuario.
  // Se recalcula automáticamente al cambiar el término de búsqueda.
  // Se usa directamente desde la plantilla.
  get filteredFriends() {
    return this.friends.filter(friend =>
      friend.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      friend.username.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Método para abrir el modal de añadir amigo.
  // Reinicia el buscador, los resultados y el estado de escritura.
  // Prepara el modal para una nueva búsqueda limpia.
  openAddFriendModal(): void {
    this.showAddFriendModal = true;
    this.searchAddFriendTerm = '';
    this.allUsers = [];
    this.typingStarted = false;
    this.cdr.detectChanges();
  }

  // Método para cerrar el modal de añadir amigo.
  // Limpia temporizadores, texto de búsqueda, resultados y estados de carga.
  // Evita que queden búsquedas pendientes activas.
  closeAddFriendModal(): void {
    clearTimeout(this.searchTimeout);
    this.showAddFriendModal = false;
    this.searchAddFriendTerm = '';
    this.allUsers = [];
    this.typingStarted = false;
    this.isSearchingUsers = false;
    this.cdr.detectChanges();
  }

  // Método ejecutado al escribir en el buscador de añadir amigo.
  // Aplica un pequeño debounce para no lanzar una petición por cada tecla.
  // Busca usuarios disponibles y marca si ya tienen solicitud enviada.
  onSearchAddFriend(): void {
    clearTimeout(this.searchTimeout);

    const term = this.searchAddFriendTerm.trim();
    this.typingStarted = term.length > 0;

    if (!term) {
      this.allUsers = [];
      this.isSearchingUsers = false;
      this.cdr.detectChanges();
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.isSearchingUsers = true;
      this.cdr.detectChanges();

      this.friendsService.searchUsers(term).subscribe({
        next: (res: any) => {
          this.allUsers = this.filterAvailableUsers(res.users || []).map(u => ({
            ...u,
            requestSent: this.sentRequests.some(s => s.toUser._id === u._id)
              || this.sentRequests.some(s => s.toUser === u._id)
          }));

          this.isSearchingUsers = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error al buscar usuarios:', err);
          this.isSearchingUsers = false;
          this.cdr.detectChanges();
        }
      });
    }, 120);
  }

  // Getter que devuelve los usuarios encontrados en el modal de añadir amigo.
  // Actualmente devuelve directamente los resultados ya filtrados.
  // Se mantiene como punto de acceso para la plantilla.
  get filteredAddFriendUsers() {
    return this.allUsers;
  }

  // Método para navegar a la pantalla de quedadas.
  // Se ejecuta desde el botón "Organizar quedada".
  goToMeetups(): void {
    this.router.navigate(['/meetups']);
  }
}