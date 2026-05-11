/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin-events.component.ts
 * Descripción: Componente encargado de la gestión de eventos desde el panel de administración.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService, AdminEventDetail } from '../../../../core/services/admin.service';

// Interface para representar un evento dentro de la tabla de administración,
// incluyendo datos básicos como nombre, fecha, inscritos, categoría y estado.
interface AdminEvent {
  id: string;
  name: string;
  date: string;
  enrolled: string;
  category: string;
  status: 'Activo' | 'Pendiente';
}

// Interface para representar el estado de la vista de eventos,
// incluyendo la lista de eventos, el estado de carga y el mensaje de error.
interface AdminEventsData {
  events: AdminEvent[];
  isLoading: boolean;
  errorMessage: string;
}

// Interface para representar los datos del formulario
// utilizado para crear o editar eventos desde administración.
interface EventForm {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  isFree: boolean;
}

// Componente encargado de gestionar la vista de eventos del panel de administración.
// Permite listar, filtrar, paginar, consultar detalles, crear, editar
// y eliminar eventos mediante llamadas al servicio de administración.
@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTopbarComponent],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.scss'
})
export class AdminEventsComponent implements OnInit {

  // Servicio utilizado para comunicarse con los endpoints de administración.
  private adminService = inject(AdminService);

  // Texto introducido en el buscador de eventos.
  search = '';

  // Estado seleccionado para filtrar la tabla de eventos.
  selectedStatus = 'Todos';
  
  // Página actual de la tabla paginada.
  currentPage = 1;

  // Número máximo de eventos mostrados por página.
  pageSize = 10;

  // Variables de control de los modales de detalle y creación/edición.
  showDetailModal = false;
  showCreateEditModal = false;
  selectedEventId: string | null = null;
  loadingDetail = false;
  errorDetail = '';

  // Estado del formulario de creación o edición de eventos.
  isEditMode = false;
  eventForm: EventForm = {
    title: '',
    description: '',
    category: '',
    startDate: '',
    endDate: '',
    location: '',
    status: 'active',
    isFree: true
  };

  // Lista de errores de validación mostrados en el formulario.
  formErrors: string[] = [];

  // Indica si el formulario se está enviando al backend.
  submittingForm = false;

  // Identificador del evento que se está eliminando actualmente.
  deletingEventId: string | null = null;

  // Mensajes globales mostrados tras operaciones de éxito o error.
  successMessage = '';
  errorMessage = '';

  // Subject utilizado para forzar la recarga de la lista de eventos.
  private refreshTrigger$ = new BehaviorSubject<void>(void 0);

  // Subject utilizado para cargar dinámicamente el detalle de un evento.
  private eventDetailTrigger$ = new BehaviorSubject<string | null>(null);

  // Observable encargado de obtener el detalle del evento seleccionado.
  // Si no hay evento seleccionado, devuelve null.
  // Gestiona también los estados de carga y error del modal de detalle.
  eventDetail$ = this.eventDetailTrigger$.pipe(
    switchMap((eventId) => {
      if (!eventId) {
        return of(null);
      }

      return this.adminService.getEventDetail(eventId).pipe(
        map((response) => {
          this.loadingDetail = false;
          return response.event;
        }),
        catchError((error) => {
          this.errorDetail = error?.error?.message || 'Error al cargar detalles del evento';
          this.loadingDetail = false;
          return of(null);
        })
      );
    })
  );

  // Observable principal de la lista de eventos.
  // Recarga los eventos cuando cambia refreshTrigger$,
  // adapta los datos recibidos y gestiona estados de carga y error.
  events$: Observable<AdminEventsData> = this.refreshTrigger$.pipe(
    switchMap(() =>
      this.adminService.getEvents().pipe(
        map((response) => ({
          events: response.events.map((event) => ({
            id: event.id,
            name: event.name,
            date: new Date(event.date).toLocaleDateString('es-ES'),
            enrolled: String(event.enrolled).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            category: event.category,
            status: event.status === 'active' ? ('Activo' as const) : ('Pendiente' as const)
          })),
          isLoading: false,
          errorMessage: ''
        })),
        catchError((error) => of({
          events: [],
          isLoading: false,
          errorMessage: error?.error?.message || 'No se pudo cargar la lista de eventos'
        }))
      )
    ),
    startWith({
      events: [],
      isLoading: true,
      errorMessage: ''
    })
  );

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Lanza una primera recarga de eventos.
  // Permite que la tabla se cargue al entrar en la vista.
  ngOnInit(): void {
    this.refreshTrigger$.next();
  }

  // Método para filtrar eventos por texto y estado.
  // Comprueba coincidencias en el nombre y la categoría.
  // Devuelve únicamente los eventos que cumplen los filtros activos.
  getFilteredEvents(events: AdminEvent[]): AdminEvent[] {
    return events.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(this.search.toLowerCase()) ||
        event.category.toLowerCase().includes(this.search.toLowerCase());

      const matchesStatus =
        this.selectedStatus === 'Todos' || event.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // Método para obtener los eventos de la página actual.
  // Aplica primero los filtros y después calcula el rango paginado.
  // Devuelve solo los eventos visibles en la tabla.
  getPaginatedEvents(events: AdminEvent[]): AdminEvent[] {
    const filtered = this.getFilteredEvents(events);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  // Método para calcular el número total de páginas.
  // Usa la cantidad de eventos filtrados y el tamaño de página.
  // Garantiza que siempre exista al menos una página.
  getTotalPages(events: AdminEvent[]): number {
    const filtered = this.getFilteredEvents(events);
    return Math.max(1, Math.ceil(filtered.length / this.pageSize));
  }

  // Método para cambiar a una página concreta.
  // Comprueba que la página solicitada esté dentro del rango válido.
  // Actualiza la página actual de la tabla.
  goToPage(page: number, totalPages: number): void {
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
    }
  }

  // Método para avanzar a la siguiente página.
  // Utiliza el número total de páginas para evitar salirse del rango.
  // Delega el cambio real en goToPage.
  nextPage(totalPages: number): void {
    this.goToPage(this.currentPage + 1, totalPages);
  }

  // Método para retroceder a la página anterior.
  // Utiliza el número total de páginas para validar el movimiento.
  // Delega el cambio real en goToPage.
  previousPage(totalPages: number): void {
    this.goToPage(this.currentPage - 1, totalPages);
  }

  // Método para reiniciar la paginación.
  // Vuelve a la primera página cuando cambian los filtros.
  // Evita mostrar páginas vacías tras filtrar.
  resetPagination(): void {
    this.currentPage = 1;
  }

  // Método para abrir el modal de creación de eventos.
  // Limpia el formulario y desactiva el modo edición.
  // Prepara el estado inicial para crear un nuevo evento.
  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedEventId = null;
    this.eventForm = {
      title: '',
      description: '',
      category: '',
      startDate: '',
      endDate: '',
      location: '',
      status: 'active',
      isFree: true
    };
    this.formErrors = [];
    this.showCreateEditModal = true;
  }

  // Método para cerrar el modal de creación o edición.
  // Reinicia el modo edición y los errores del formulario.
  // No modifica la lista de eventos directamente.
  closeCreateEditModal(): void {
    this.showCreateEditModal = false;
    this.isEditMode = false;
    this.formErrors = [];
  }

  // Método para abrir el modal de detalle de un evento.
  // Guarda el identificador del evento seleccionado.
  // Dispara la carga de datos detallados desde el backend.
  viewEventDetail(event: AdminEvent): void {
    this.selectedEventId = event.id;
    this.errorDetail = '';
    this.loadingDetail = true;
    this.showDetailModal = true;
    this.eventDetailTrigger$.next(event.id);
  }

  // Método para cerrar el modal de detalle.
  // Limpia estados de carga y errores.
  // Si no se está editando, también limpia el evento seleccionado.
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.loadingDetail = false;
    this.errorDetail = '';

    if (!this.isEditMode) {
      this.selectedEventId = null;
    }

    this.eventDetailTrigger$.next(null);
  }

  // Método para abrir el modal de edición desde el detalle del evento.
  // Copia los datos del evento al formulario.
  // Cierra el modal de detalle y abre el formulario en modo edición.
  openEditModal(eventDetail: AdminEventDetail): void {
    // Se conserva el identificador del evento antes de cerrar el modal de detalle.
    const eventIdToEdit = this.selectedEventId;
    
    this.isEditMode = true;
    this.eventForm = {
      title: eventDetail.title,
      description: eventDetail.description,
      category: eventDetail.category,
      startDate: eventDetail.startDate?.split('T')[0] || '',
      endDate: eventDetail.endDate?.split('T')[0] || '',
      location: eventDetail.location,
      status: eventDetail.status,
      isFree: eventDetail.isFree
    };
    this.formErrors = [];
    this.closeDetailModal();

    // Se restaura el ID para que la actualización se aplique al evento correcto.
    this.selectedEventId = eventIdToEdit;
    this.showCreateEditModal = true;
  }

  // Método para abrir directamente el modal de edición desde la tabla.
  // Muestra el formulario de inmediato y carga los datos del evento en paralelo.
  // Si ocurre un error, lo añade a la lista de errores del formulario.
  openEditModalDirect(event: AdminEvent): void {
    this.selectedEventId = event.id;
    this.showDetailModal = false;
    this.isEditMode = true;
    this.formErrors = [];

    // Se abre el modal antes de completar la carga para mejorar la respuesta visual.
    this.showCreateEditModal = true;

    // Carga de los datos completos del evento seleccionado.
    this.adminService.getEventDetail(event.id).subscribe({
      next: (response) => {
        this.eventForm = {
          title: response.event.title,
          description: response.event.description,
          category: response.event.category,
          startDate: response.event.startDate?.split('T')[0] || '',
          endDate: response.event.endDate?.split('T')[0] || '',
          location: response.event.location,
          status: response.event.status,
          isFree: response.event.isFree
        };
      },
      error: (error) => {
        this.formErrors.push(error?.error?.message || 'Error al cargar evento para editar');
      }
    });
  }

  // Método para validar el formulario de evento.
  // Comprueba que los campos obligatorios estén informados.
  // Devuelve true si no existen errores de validación.
  validateForm(): boolean {
    this.formErrors = [];
    if (!this.eventForm.title.trim()) this.formErrors.push('El título es obligatorio');
    if (!this.eventForm.description.trim()) this.formErrors.push('La descripción es obligatoria');
    if (!this.eventForm.category.trim()) this.formErrors.push('La categoría es obligatoria');
    if (!this.eventForm.location.trim()) this.formErrors.push('La ubicación es obligatoria');
    return this.formErrors.length === 0;
  }

  // Método para enviar el formulario de creación o edición.
  // Valida los datos, construye el objeto de evento
  // y llama al backend para crear o actualizar según el modo activo.
  submitForm(): void {
    if (!this.validateForm()) return;

    this.submittingForm = true;

    // Datos enviados al backend para crear o actualizar el evento.
    const eventData = {
      title: this.eventForm.title,
      description: this.eventForm.description,
      category: this.eventForm.category,
      startDate: this.eventForm.startDate || null,
      endDate: this.eventForm.endDate || null,
      location: this.eventForm.location,
      status: this.eventForm.status,
      isFree: this.eventForm.isFree
    };

    // Selección de la petición correspondiente según creación o edición.
    const request = this.isEditMode && this.selectedEventId
      ? this.adminService.updateEvent(this.selectedEventId, eventData)
      : this.adminService.createEvent(eventData);

    request.subscribe({
      next: () => {
        this.successMessage = this.isEditMode ? 'Evento actualizado exitosamente' : 'Evento creado exitosamente';
        this.submittingForm = false;
        setTimeout(() => {
          this.successMessage = '';
          this.closeCreateEditModal();
          this.refreshTrigger$.next();
        }, 2000);
      },
      error: (error) => {
        this.formErrors.push(error?.error?.message || 'Error al guardar evento');
        this.submittingForm = false;
      }
    });
  }

  // Método para eliminar un evento de la plataforma.
  // Solicita confirmación al usuario antes de ejecutar la acción.
  // Si se elimina correctamente, refresca la lista de eventos.
  deleteEventAction(eventId: string): void {
    if (!eventId) return;
    
    const confirmed = confirm('¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    this.deletingEventId = eventId;
    this.adminService.deleteEvent(eventId).subscribe({
      next: () => {
        this.successMessage = 'Evento eliminado exitosamente';
        this.deletingEventId = null;
        setTimeout(() => {
          this.successMessage = '';
          this.closeDetailModal();
          this.refreshTrigger$.next();
        }, 2000);
      },
      error: (error) => {
        this.errorDetail = error?.error?.message || 'Error al eliminar evento';
        this.deletingEventId = null;
      }
    });
  }
}