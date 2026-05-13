/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: meetups.component.ts
 * Descripción: Componente encargado de gestionar la creación de quedadas, la selección de amigos
 * y eventos, las quedadas organizadas y las invitaciones recibidas por el usuario.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { HeaderComponent } from '../../layout/components/header/header';
import { FriendsService } from '../../core/services/friends.service';
import { EventService } from '../../core/services/event.service';
import { MeetupService } from '../../core/services/meetup.service';
import { StripHtmlPipe } from '../../shared/pipes/strip-html.pipe';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';

// Componente encargado de gestionar la pantalla de quedadas.
// Permite crear quedadas con amigos, seleccionar eventos,
// consultar quedadas organizadas y responder invitaciones.
@Component({
  standalone: true,
  selector: 'app-meetups',
  templateUrl: './meetups.component.html',
  styleUrl: './meetups.component.scss',
  imports: [CommonModule, FormsModule, HeaderComponent, StripHtmlPipe]
})
export class MeetupsComponent implements OnInit {

  // Servicio utilizado para obtener la lista de amigos del usuario.
  private friendsService = inject(FriendsService);

  // Servicio utilizado para consultar eventos disponibles para quedadas.
  private eventService = inject(EventService);

  // Servicio encargado de crear, consultar, cancelar y responder quedadas.
  private meetupService = inject(MeetupService);

  // Referencia para forzar la detección de cambios cuando se actualizan datos.
  private cdr = inject(ChangeDetectorRef);

  // Servicio de autenticación utilizado para obtener el usuario actual.
  private authService = inject(AuthService);

  // Servicio global para mantener actualizadas las notificaciones de quedadas.
  private notificationsService = inject(NotificationsService);

  // Indica si existen invitaciones pendientes a quedadas.
  hasPendingMeetupInvitations = false;

  // Número de invitaciones pendientes a quedadas.
  pendingMeetupInvitationsCount = 0;

  // Identificador del usuario autenticado.
  currentUserId = '';

  // Listado de amigos disponibles para invitar.
  friends: any[] = [];

  // Listado de eventos disponibles para asociar a una quedada.
  events: any[] = [];

  // Quedadas creadas por el usuario actual.
  organizedMeetups: any[] = [];

  // Quedadas a las que el usuario ha sido invitado.
  invitedMeetups: any[] = [];

  // Conjunto de amigos seleccionados para la nueva quedada.
  selectedFriendIds = new Set<string>();

  // Identificador del evento seleccionado para la quedada.
  selectedEventId = '';

  // Texto usado para filtrar amigos en el paso de selección.
  searchFriendTerm = '';

  // Categoría seleccionada para filtrar eventos.
  selectedCategory = '';

  // Página actual del listado de eventos.
  eventPage = 1;

  // Número total de páginas de eventos disponibles.
  eventTotalPages = 1;

  // Estados de carga de cada bloque principal de la pantalla.
  loadingFriends = false;
  loadingEvents = false;
  loadingOrganized = false;
  loadingInvited = false;

  // Indica si se está creando una quedada en el backend.
  creatingMeetup = false;

  // Controla la visibilidad del modal de creación.
  showCreateModal = false;

  // Fecha y hora seleccionadas para la quedada.
  meetupDateTime = '';

  // Lugar concreto indicado para el punto de encuentro.
  meetupPlace = '';

  // Pestaña activa de la pantalla de quedadas.
  activeTab: 'create' | 'organized' | 'invited' = 'create';

  // Categorías disponibles para filtrar eventos.
  categories = [
    'Deporte',
    'Música',
    'Teatro y Artes Escénicas',
    'Artes plásticas',
    'Cursos y Talleres',
    'Formación',
    'Ocio y Juegos',
    'Turismo',
    'Gastronomía',
    'Aire Libre y Excursiones',
    'Medio Ambiente y Naturaleza',
    'Conferencias y Congresos',
    'Imagen y sonido',
    'Idiomas',
    'Desarrollo personal',
    'Otros',
  ];

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Obtiene el usuario actual, carga amigos, eventos, quedadas e invitaciones.
  // También se suscribe a los cambios de notificaciones de quedadas.
  ngOnInit(): void {
    const user = this.authService.getCurrentUser() as any;
    this.currentUserId = user?._id || '';

    this.loadFriends();
    this.loadEvents();
    this.loadOrganizedMeetups();
    this.loadInvitedMeetups();

    this.notificationsService.meetupInvitations$.subscribe(data => {
      this.hasPendingMeetupInvitations = data?.hasPending || false;
      this.pendingMeetupInvitationsCount = data?.count || 0;
      this.cdr.detectChanges();
    });

    this.loadPendingMeetupInvitations();
  }

  // Método para cargar el número de invitaciones pendientes a quedadas.
  // Consulta el backend y actualiza el estado global de notificaciones.
  // Permite mostrar el punto rojo en la pestaña de invitaciones.
  loadPendingMeetupInvitations(): void {
    this.meetupService.getPendingInvitationsCount().subscribe({
      next: (res) => {
        this.notificationsService.setMeetupInvitations({
          hasPending: !!res?.hasPendingMeetupInvitations,
          count: res?.pendingInvitationsCount || 0
        });
      },
      error: (err) => {
        console.error('Error al cargar invitaciones pendientes de quedadas:', err);
      }
    });
  }

  // Método para cargar los amigos del usuario.
  // Activa el estado de carga mientras se consulta el backend.
  // Al finalizar, actualiza la vista tanto si la petición funciona como si falla.
  loadFriends(): void {
    this.loadingFriends = true;

    this.friendsService.getFriends()
      .pipe(finalize(() => {
        this.loadingFriends = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.friends = res.friends || [];
        },
        error: (err) => {
          console.error('Error al cargar amigos:', err);
        }
      });
  }

  // Método para cargar eventos disponibles para crear quedadas.
  // Aplica filtros de categoría y estado activo.
  // Actualiza también la paginación del listado de eventos.
  loadEvents(): void {
    this.loadingEvents = true;

    const filters: any = {};
    if (this.selectedCategory) filters.category = this.selectedCategory;
    filters.status = 'active';

    this.eventService.getEvents(this.eventPage, 8, filters)
      .pipe(finalize(() => {
        this.loadingEvents = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.events = res.data || [];
          this.eventTotalPages = res.totalPages || 1;
        },
        error: (err) => {
          console.error('Error al cargar eventos:', err);
        }
      });
  }

  // Método para cargar las quedadas organizadas por el usuario.
  // Recupera desde el backend las quedadas creadas por el usuario actual.
  // Actualiza el estado de carga al terminar la petición.
  loadOrganizedMeetups(): void {
    this.loadingOrganized = true;

    this.meetupService.getOrganizedMeetups()
      .pipe(finalize(() => {
        this.loadingOrganized = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.organizedMeetups = res.meetups || [];
        },
        error: (err) => {
          console.error('Error al cargar quedadas organizadas:', err);
        }
      });
  }

  // Método para cargar las quedadas a las que el usuario ha sido invitado.
  // Permite mostrar invitaciones pendientes o ya respondidas.
  // Actualiza la sección de invitaciones de la pantalla.
  loadInvitedMeetups(): void {
    this.loadingInvited = true;

    this.meetupService.getInvitedMeetups()
      .pipe(finalize(() => {
        this.loadingInvited = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.invitedMeetups = res.meetups || [];
        },
        error: (err) => {
          console.error('Error al cargar quedadas invitadas:', err);
        }
      });
  }

  // Método para seleccionar o deseleccionar un amigo.
  // Usa una nueva instancia de Set para forzar la actualización de la vista.
  // Permite marcar varios amigos como invitados a la quedada.
  toggleFriendSelection(friendId: string): void {
    const next = new Set(this.selectedFriendIds);

    if (next.has(friendId)) {
      next.delete(friendId);
    } else {
      next.add(friendId);
    }

    this.selectedFriendIds = next;
    this.cdr.detectChanges();
  }

  // Método para seleccionar o deseleccionar un evento.
  // Si se pulsa el mismo evento seleccionado, se limpia la selección.
  // Solo puede existir un evento asociado a cada quedada.
  selectEvent(eventId: string): void {
    this.selectedEventId = this.selectedEventId === eventId ? '' : eventId;
    this.cdr.detectChanges();
  }

  // Método para seleccionar o limpiar una categoría de eventos.
  // Reinicia la paginación y vuelve a cargar eventos filtrados.
  // Permite alternar el filtro si se pulsa la misma categoría.
  selectCategory(category: string): void {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.eventPage = 1;
    this.loadEvents();
  }

  // Método para retroceder una página en el listado de eventos.
  // Solo actúa si la página actual es mayor que uno.
  // Después recarga los eventos correspondientes.
  prevPage(): void {
    if (this.eventPage > 1) {
      this.eventPage--;
      this.loadEvents();
    }
  }

  // Método para avanzar una página en el listado de eventos.
  // Solo actúa si todavía quedan páginas disponibles.
  // Después recarga los eventos correspondientes.
  nextPage(): void {
    if (this.eventPage < this.eventTotalPages) {
      this.eventPage++;
      this.loadEvents();
    }
  }

  // Método para abrir el modal de creación de quedada.
  // Solo se abre si hay al menos un amigo y un evento seleccionados.
  // Permite completar fecha, hora y lugar de encuentro.
  openCreateModal(): void {
    if (!this.selectedEventId || this.selectedFriendIds.size === 0) return;

    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  // Método para cerrar el modal de creación de quedada.
  // Limpia la fecha, hora y lugar introducidos.
  // Devuelve el formulario del modal a su estado inicial.
  closeCreateModal(): void {
    this.showCreateModal = false;
    this.meetupDateTime = '';
    this.meetupPlace = '';
    this.cdr.detectChanges();
  }

  // Método para crear una nueva quedada.
  // Valida que existan evento, amigos, fecha y lugar.
  // Envía los datos al backend y, si todo va bien, cambia a la pestaña de organizadas.
  createMeetup(): void {
    if (!this.selectedEventId || this.selectedFriendIds.size === 0) return;
    if (!this.meetupDateTime || !this.meetupPlace.trim()) return;

    this.creatingMeetup = true;

    this.meetupService.createMeetup({
      eventId: this.selectedEventId,
      friendIds: Array.from(this.selectedFriendIds),
      meetupDateTime: this.meetupDateTime,
      meetupPlace: this.meetupPlace.trim()
    })
      .pipe(finalize(() => {
        this.creatingMeetup = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.selectedFriendIds = new Set<string>();
          this.selectedEventId = '';
          this.closeCreateModal();
          this.loadOrganizedMeetups();
          this.activeTab = 'organized';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al crear quedada:', err);
        }
      });
  }

  // Método para responder a una invitación de quedada.
  // Envía al backend si el usuario acepta o rechaza.
  // Después recarga invitaciones y refresca las notificaciones globales.
  respondToMeetup(meetupId: string, response: 'accepted' | 'rejected'): void {
    this.meetupService.respondToMeetup(meetupId, response).subscribe({
      next: () => {
        this.loadInvitedMeetups();
        this.notificationsService.refreshAllFriendsNotifications();
      },
      error: (err) => {
        console.error('Error al responder quedada:', err);
      }
    });
  }

  // Método para cancelar una quedada organizada por el usuario.
  // Solicita la cancelación al backend.
  // Después recarga las quedadas organizadas e invitadas.
  cancelMeetup(meetupId: string): void {
    this.meetupService.cancelMeetup(meetupId).subscribe({
      next: () => {
        this.loadOrganizedMeetups();
        this.loadInvitedMeetups();
      },
      error: (err) => {
        console.error('Error al cancelar quedada:', err);
      }
    });
  }

  // Getter que devuelve los amigos filtrados por nombre o usuario.
  // Si no hay texto de búsqueda, devuelve todos los amigos.
  // Se usa directamente desde la plantilla de selección.
  get filteredFriends(): any[] {
    const term = this.searchFriendTerm.trim().toLowerCase();
    if (!term) return this.friends;

    return this.friends.filter(friend =>
      friend.name?.toLowerCase().includes(term) ||
      friend.username?.toLowerCase().includes(term)
    );
  }

  // Getter que devuelve el número de amigos seleccionados.
  // Permite mostrar el contador resumen de la creación de quedadas.
  get selectedFriendsCount(): number {
    return this.selectedFriendIds.size;
  }

  // Getter que indica si ya se puede abrir el modal de creación.
  // Requiere un evento seleccionado y al menos un amigo elegido.
  // Controla el estado habilitado del botón "Crear quedada".
  get canOpenCreateModal(): boolean {
    return !!this.selectedEventId && this.selectedFriendIds.size > 0;
  }

  // Método para obtener la respuesta del usuario actual en una quedada.
  // Busca al participante correspondiente dentro de la quedada.
  // Devuelve pending si todavía no ha respondido.
  getParticipantResponse(meetup: any): string {
    if (!this.currentUserId) return '';

    const participant = meetup?.participants?.find(
      (p: any) => (p.user?._id || p.user) === this.currentUserId
    );

    return participant?.response || 'pending';
  }
}