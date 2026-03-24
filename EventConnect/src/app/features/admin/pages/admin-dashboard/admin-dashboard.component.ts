import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService } from '../../../../core/services/admin.service';

interface DashboardStat {
  icon: string;
  value: string;
  label: string;
  detail: string;
}

interface DashboardUpcomingEvent {
  name: string;
  date: string;
  enrolled: string;
  status: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminTopbarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  private adminService = inject(AdminService);

  dashboard$: Observable<{
    stats: DashboardStat[];
    upcomingEvents: DashboardUpcomingEvent[];
    isLoading: boolean;
    errorMessage: string;
  }> = this.adminService.getDashboard().pipe(
    map((response) => ({
      stats: [
        {
          icon: '👥',
          value: String(response.stats.totalUsers),
          label: 'Usuarios Registrados',
          detail: 'Total actual'
        },
        {
          icon: '🎪',
          value: String(response.stats.activeEvents),
          label: 'Eventos Activos',
          detail: 'Total actual'
        },
        {
          icon: '⚠',
          value: String(response.stats.pendingModeration),
          label: 'Pendientes Moderación',
          detail: 'Requiere atención'
        },
        {
          icon: '📝',
          value: String(response.stats.totalRegistrations),
          label: 'Total Inscripciones',
          detail: 'Total actual'
        }
      ],
      upcomingEvents: response.upcomingEvents.map((event) => ({
        name: event.name,
        date: new Date(event.date).toLocaleDateString('es-ES'),
        enrolled: String(event.enrolled),
        status: event.status === 'active' ? 'Activo' : event.status
      })),
      isLoading: false,
      errorMessage: ''
    })),
    startWith({
      stats: [
        { icon: '👥', value: '0', label: 'Usuarios Registrados', detail: 'Total actual' },
        { icon: '🎪', value: '0', label: 'Eventos Activos', detail: 'Total actual' },
        { icon: '⚠', value: '0', label: 'Pendientes Moderación', detail: 'Requiere atención' },
        { icon: '📝', value: '0', label: 'Total Inscripciones', detail: 'Total actual' }
      ],
      upcomingEvents: [],
      isLoading: true,
      errorMessage: ''
    }),
    catchError((error) => of({
      stats: [
        { icon: '👥', value: '0', label: 'Usuarios Registrados', detail: 'Total actual' },
        { icon: '🎪', value: '0', label: 'Eventos Activos', detail: 'Total actual' },
        { icon: '⚠', value: '0', label: 'Pendientes Moderación', detail: 'Requiere atención' },
        { icon: '📝', value: '0', label: 'Total Inscripciones', detail: 'Total actual' }
      ],
      upcomingEvents: [],
      isLoading: false,
      errorMessage: error?.error?.message || 'No se pudo cargar el dashboard de admin'
    }))
  );
}