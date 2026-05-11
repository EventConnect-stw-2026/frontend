/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin-dashboard.component.ts
 * Descripción: Componente encargado de mostrar el dashboard principal del panel de administración.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService } from '../../../../core/services/admin.service';
import Chart from 'chart.js/auto';

// Interface para representar una tarjeta de estadística del dashboard,
// incluyendo icono, valor principal, etiqueta descriptiva y detalle adicional.
interface DashboardStat {
  icon: string;
  value: string;
  label: string;
  detail: string;
}

// Interface para representar un próximo evento mostrado en el dashboard,
// incluyendo nombre, fecha, número de inscritos y estado del evento.
interface DashboardUpcomingEvent {
  name: string;
  date: string;
  enrolled: string;
  status: string;
}

// Interface para representar los datos utilizados en la gráfica de actividad,
// incluyendo etiquetas y series de datos para inscripciones, usuarios y reportes.
interface ActivityData {
  labels: string[];
  eventSignups: number[];
  userRegistrations: number[];
  reportsFiled: number[];
}

// Interface para representar el estado completo del dashboard,
// incluyendo estadísticas, eventos próximos, datos de actividad,
// estado de carga y posibles mensajes de error.
interface DashboardData {
  stats: DashboardStat[];
  upcomingEvents: DashboardUpcomingEvent[];
  activityData: ActivityData;
  isLoading: boolean;
  errorMessage: string;
}

// Componente encargado de mostrar el dashboard principal de administración.
// Obtiene los datos desde el servicio de administración,
// transforma la información recibida y renderiza una gráfica de actividad semanal.
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminTopbarComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements AfterViewInit {

  // Servicio utilizado para obtener los datos administrativos del backend.
  private adminService = inject(AdminService);
  
  // Referencia al canvas donde se renderiza la gráfica de actividad.
  @ViewChild('activityChart') chartCanvas!: ElementRef;

  // Instancia actual de la gráfica generada con Chart.js.
  private chart: Chart | null = null;

  // Datos actuales del dashboard utilizados para pintar la interfaz y la gráfica.
  private dashboardData: DashboardData | null = null;

  // Observable principal del dashboard.
  // Obtiene los datos del backend, los adapta al formato de la vista
  // y gestiona estados de carga y error.
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

  // Método del ciclo de vida de Angular ejecutado tras inicializar la vista.
  // Se suscribe al observable del dashboard para capturar los datos.
  // Cuando los datos están listos, solicita el renderizado de la gráfica.
  ngAfterViewInit(): void {
    // Suscripción única para capturar y actualizar los datos del dashboard.
    this.dashboard$.subscribe((data) => {
      this.dashboardData = data;

      // Renderizado del gráfico cuando los datos están disponibles y no están cargando.
      if (data.activityData.labels.length > 0 && !data.isLoading) {
        setTimeout(() => this.renderChart(), 100);
      }
    });
  }

  // Método privado encargado de renderizar la gráfica de actividad semanal.
  // Comprueba que exista el canvas y que haya datos disponibles.
  // Si ya existe una gráfica previa, la destruye antes de crear una nueva.
  private renderChart(): void {
    if (!this.chartCanvas || !this.chartCanvas.nativeElement || !this.dashboardData) {
      return;
    }

    // Obtención del contexto 2D del canvas.
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    // Destrucción de la gráfica anterior para evitar duplicados.
    if (this.chart) {
      this.chart.destroy();
    }

    // Datos de actividad utilizados por Chart.js.
    const data = this.dashboardData.activityData;

    // Creación de la gráfica de líneas con las tres series de actividad.
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