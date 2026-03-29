import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService } from '../../../../core/services/admin.service';
import Chart from 'chart.js/auto';

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

interface ActivityData {
  labels: string[];
  eventSignups: number[];
  userRegistrations: number[];
  reportsFiled: number[];
}

interface DashboardData {
  stats: DashboardStat[];
  upcomingEvents: DashboardUpcomingEvent[];
  activityData: ActivityData;
  isLoading: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminTopbarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements AfterViewInit {
  private adminService = inject(AdminService);
  
  @ViewChild('activityChart') chartCanvas!: ElementRef;
  private chart: Chart | null = null;
  private dashboardData: DashboardData | null = null;

  dashboard$: Observable<DashboardData> = this.adminService.getDashboard().pipe(
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
      activityData: {
        labels: response.activityData?.labels || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        eventSignups: response.activityData?.eventSignups || [0, 0, 0, 0, 0, 0, 0],
        userRegistrations: response.activityData?.userRegistrations || [0, 0, 0, 0, 0, 0, 0],
        reportsFiled: response.activityData?.reportsFiled || [0, 0, 0, 0, 0, 0, 0]
      },
      isLoading: false,
      errorMessage: ''
    })),
    startWith({
      stats: [
        { icon: '👥', value: '0', label: 'Usuarios Registrados', detail: 'Total actual' },
        { icon: '🎪', value: '0', label: 'Eventos Activos', detail: 'Total actual' },
        { icon: '📝', value: '0', label: 'Total Inscripciones', detail: 'Total actual' }
      ],
      upcomingEvents: [],
      activityData: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        eventSignups: [0, 0, 0, 0, 0, 0, 0],
        userRegistrations: [0, 0, 0, 0, 0, 0, 0],
        reportsFiled: [0, 0, 0, 0, 0, 0, 0]
      },
      isLoading: true,
      errorMessage: ''
    }),
    catchError((error) => of({
      stats: [
        { icon: '👥', value: '0', label: 'Usuarios Registrados', detail: 'Total actual' },
        { icon: '🎪', value: '0', label: 'Eventos Activos', detail: 'Total actual' },
        { icon: '📝', value: '0', label: 'Total Inscripciones', detail: 'Total actual' }
      ],
      upcomingEvents: [],
      activityData: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        eventSignups: [0, 0, 0, 0, 0, 0, 0],
        userRegistrations: [0, 0, 0, 0, 0, 0, 0],
        reportsFiled: [0, 0, 0, 0, 0, 0, 0]
      },
      isLoading: false,
      errorMessage: error?.error?.message || 'No se pudo cargar el dashboard de admin'
    }))
  );

  ngAfterViewInit(): void {
    // Subscribe una sola vez para capturar los datos
    this.dashboard$.subscribe((data) => {
      this.dashboardData = data;
      // Renderizar el gráfico cuando los datos estén listos
      if (data.activityData.labels.length > 0 && !data.isLoading) {
        setTimeout(() => this.renderChart(), 100);
      }
    });
  }

  private renderChart(): void {
    if (!this.chartCanvas || !this.chartCanvas.nativeElement || !this.dashboardData) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    if (this.chart) {
      this.chart.destroy();
    }

    const data = this.dashboardData.activityData;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Inscripciones a Eventos',
            data: data.eventSignups,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#4CAF50'
          },
          {
            label: 'Nuevos Usuarios',
            data: data.userRegistrations,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#2196F3'
          },
          {
            label: 'Reportes Presentados',
            data: data.reportsFiled,
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#FF9800'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    });
  }
}