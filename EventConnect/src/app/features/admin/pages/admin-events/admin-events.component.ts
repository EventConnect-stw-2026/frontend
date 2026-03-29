import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService, AdminEventDetail } from '../../../../core/services/admin.service';

interface AdminEvent {
  id: string;
  name: string;
  date: string;
  enrolled: string;
  category: string;
  status: 'Activo' | 'Pendiente';
}

interface AdminEventsData {
  events: AdminEvent[];
  isLoading: boolean;
  errorMessage: string;
}

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

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTopbarComponent],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.scss'
})
export class AdminEventsComponent implements OnInit {
  private adminService = inject(AdminService);

  search = '';
  selectedStatus = 'Todos';

  // Modal state
  showDetailModal = false;
  showCreateEditModal = false;
  selectedEventId: string | null = null;
  loadingDetail = false;
  errorDetail = '';

  // Form state
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
  formErrors: string[] = [];
  submittingForm = false;

  // Action states
  deletingEventId: string | null = null;

  // Messages
  successMessage = '';
  errorMessage = '';

  private refreshTrigger$ = new BehaviorSubject<void>(void 0);
  private eventDetailTrigger$ = new BehaviorSubject<string | null>(null);

  eventDetail$ = this.eventDetailTrigger$.pipe(
    switchMap((eventId) => {
      if (!eventId) {
        return of(null);
      }
      this.loadingDetail = true;
      return this.adminService.getEventDetail(eventId).pipe(
        map((response) => response.event),
        catchError((error) => {
          this.errorDetail = error?.error?.message || 'Error al cargar detalles del evento';
          this.loadingDetail = false;
          return of(null);
        }),
        map((event) => {
          this.loadingDetail = false;
          return event;
        })
      );
    })
  );

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

  ngOnInit(): void {
    this.refreshTrigger$.next();
  }

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

  closeCreateEditModal(): void {
    this.showCreateEditModal = false;
    this.isEditMode = false;
    this.formErrors = [];
  }

  viewEventDetail(event: AdminEvent): void {
    this.selectedEventId = event.id;
    this.showDetailModal = true;
    this.errorDetail = '';
    this.eventDetailTrigger$.next(event.id);
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    // Solo limpiar selectedEventId si no estamos en modo edición
    if (!this.isEditMode) {
      this.selectedEventId = null;
    }
    this.eventDetailTrigger$.next(null);
  }

  openEditModal(eventDetail: AdminEventDetail): void {
    // Guardar el ID del evento antes de cambiar de modal
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
    // Restaurar el ID después de cerrar el modal de detalles
    this.selectedEventId = eventIdToEdit;
    this.showCreateEditModal = true;
  }

  openEditModalDirect(event: AdminEvent): void {
    this.selectedEventId = event.id;
    this.showDetailModal = false;
    this.isEditMode = true;
    this.formErrors = [];
    // Abrir el modal INMEDIATAMENTE
    this.showCreateEditModal = true;

    // Cargar los datos en paralelo
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

  validateForm(): boolean {
    this.formErrors = [];
    if (!this.eventForm.title.trim()) this.formErrors.push('El título es obligatorio');
    if (!this.eventForm.description.trim()) this.formErrors.push('La descripción es obligatoria');
    if (!this.eventForm.category.trim()) this.formErrors.push('La categoría es obligatoria');
    if (!this.eventForm.location.trim()) this.formErrors.push('La ubicación es obligatoria');
    return this.formErrors.length === 0;
  }

  submitForm(): void {
    if (!this.validateForm()) return;

    this.submittingForm = true;
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