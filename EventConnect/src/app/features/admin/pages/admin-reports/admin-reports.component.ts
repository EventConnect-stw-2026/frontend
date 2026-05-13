/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin-reports.component.ts
 * Descripción: Componente encargado de la gestión de reportes desde el panel de administración.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService, AdminReport, AdminReportDetail } from '../../../../core/services/admin.service';

// Tipo que representa las pestañas disponibles para clasificar reportes.
type ReportTab = 'Contenido' | 'Usuarios' | 'Eventos';

// Interface para representar una tarjeta resumen de reportes,
// incluyendo valor, etiqueta, icono y variante visual.
interface ReportSummary {
  value: number;
  label: string;
  icon: string;
  variant: 'danger' | 'warning' | 'soft-warning';
}

// Interface para representar el estado de la lista de reportes,
// incluyendo los reportes cargados, el estado de carga y posibles errores.
interface AdminReportsData {
  reports: AdminReport[];
  isLoading: boolean;
  errorMessage: string;
}

// Interface para representar el estado del resumen de reportes,
// incluyendo las tarjetas, el estado de carga y posibles errores.
interface AdminReportsSummaryData {
  summaryCards: ReportSummary[];
  isLoading: boolean;
  errorMessage: string;
}

// Componente encargado de gestionar los reportes del panel de administración.
// Permite visualizar reportes por categoría, filtrar resultados,
// consultar detalles y ejecutar acciones de moderación.
@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTopbarComponent],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss'
})
export class AdminReportsComponent implements OnInit {

  // Servicio utilizado para comunicarse con los endpoints administrativos.
  private adminService = inject(AdminService);

  // Pestaña activa para clasificar los reportes mostrados.
  activeTab: ReportTab = 'Contenido';

  // Texto introducido en el buscador de reportes.
  search = '';

  // Filtro seleccionado por razón del reporte.
  selectedFilter = 'Todos';
  
  // Página actual de la tabla paginada.
  currentPage = 1;

  // Número máximo de reportes mostrados por página.
  pageSize = 10;

  // Estado del modal de detalles del reporte.
  showDetailModal = false;
  selectedReportId: string | null = null;
  reportDetail$: Observable<AdminReportDetail | null> = of(null);
  loadingDetail = false;
  errorDetail = '';

  // Estados asociados a las acciones de moderación.
  resolvingReportId: string | null = null;
  rejectingReportId: string | null = null;
  reviewingReportId: string | null = null;
  resolutionText = '';
  bandUser = false;
  rejectReason = '';
  successMessage = '';
  errorMessage = '';

  // Subject utilizado para forzar la recarga de la lista de reportes.
  private refreshTrigger$ = new BehaviorSubject<void>(void 0);

  // Observable encargado de cargar el resumen superior de reportes.
  // Transforma la respuesta del backend en tarjetas visuales.
  // Gestiona estados iniciales de carga y errores.
  summary$: Observable<AdminReportsSummaryData> = this.adminService.getReportsSummary().pipe(
    map((response) => ({
      summaryCards: [
        {
          value: response.summary.contentReports,
          label: 'Contenidos reportados',
          icon: '⚑',
          variant: 'danger' as const
        },
        {
          value: response.summary.userReports,
          label: 'Usuarios reportados',
          icon: '👤',
          variant: 'warning' as const
        },
        {
          value: response.summary.eventReports,
          label: 'Eventos reportados',
          icon: '🗂',
          variant: 'soft-warning' as const
        }
      ],
      isLoading: false,
      errorMessage: ''
    })),
    startWith({
      summaryCards: [
        { value: 0, label: 'Contenidos reportados', icon: '⚑', variant: 'danger' as const },
        { value: 0, label: 'Usuarios reportados', icon: '👤', variant: 'warning' as const },
        { value: 0, label: 'Eventos reportados', icon: '🗂', variant: 'soft-warning' as const }
      ],
      isLoading: true,
      errorMessage: ''
    }),
    catchError((error) => of({
      summaryCards: [
        { value: 0, label: 'Contenidos reportados', icon: '⚑', variant: 'danger' as const },
        { value: 0, label: 'Usuarios reportados', icon: '👤', variant: 'warning' as const },
        { value: 0, label: 'Eventos reportados', icon: '🗂', variant: 'soft-warning' as const }
      ],
      isLoading: false,
      errorMessage: error?.error?.message || 'No se pudo cargar el resumen de reportes'
    }))
  );

  // Observable principal de la lista de reportes.
  // Se recarga mediante refreshTrigger$ y obtiene los datos desde el backend.
  // Incluye estados de carga y control de errores.
  reports$: Observable<AdminReportsData> = this.refreshTrigger$.pipe(
    switchMap(() => this.adminService.getReports()),
    map((response) => ({
      reports: response.reports || [],
      isLoading: false,
      errorMessage: ''
    })),
    startWith({
      reports: [],
      isLoading: true,
      errorMessage: ''
    }),
    catchError((error) => of({
      reports: [],
      isLoading: false,
      errorMessage: error?.error?.message || 'No se pudo cargar la lista de reportes'
    }))
  );

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Lanza la primera carga de reportes.
  // Permite que la tabla se muestre al entrar en la vista.
  ngOnInit(): void {
    this.refreshTrigger$.next();
  }

  // Getter auxiliar de tarjetas resumen.
  // Actualmente no se utiliza porque el resumen se obtiene desde summary$.
  // Se mantiene por compatibilidad con posibles usos de plantilla.
  get summaryCards(): ReportSummary[] {
    return [];
  }

  // Método para cambiar la pestaña activa de reportes.
  // Actualiza la categoría seleccionada y reinicia la paginación.
  // Permite separar reportes de contenido, usuarios y eventos.
  setTab(tab: ReportTab): void {
    this.activeTab = tab;
    this.resetPagination();
  }

  // Método para filtrar reportes por pestaña, texto y razón.
  // Comprueba coincidencias en tipo, usuario, descripción y motivo.
  // Devuelve únicamente los reportes que cumplen los filtros activos.
  getFilteredReports(reports: AdminReport[]): AdminReport[] {
    return reports.filter((report) => {
      const matchesTab = report.category === this.activeTab;

      const term = this.search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        report.type.toLowerCase().includes(term) ||
        report.involvedUser.toLowerCase().includes(term) ||
        report.involvedUsername.toLowerCase().includes(term) ||
        report.description.toLowerCase().includes(term) ||
        report.reason.toLowerCase().includes(term);

      const matchesFilter =
        this.selectedFilter === 'Todos' ||
        report.reason === this.selectedFilter;

      return matchesTab && matchesSearch && matchesFilter;
    });
  }

  // Método para obtener los reportes de la página actual.
  // Aplica primero los filtros activos y después calcula el rango paginado.
  // Devuelve únicamente los reportes visibles en la tabla.
  getPaginatedReports(reports: AdminReport[]): AdminReport[] {
    const filtered = this.getFilteredReports(reports);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  // Método para calcular el número total de páginas.
  // Usa el número de reportes filtrados y el tamaño de página.
  // Garantiza que siempre exista al menos una página.
  getTotalPages(reports: AdminReport[]): number {
    const filtered = this.getFilteredReports(reports);
    return Math.max(1, Math.ceil(filtered.length / this.pageSize));
  }

  // Método para navegar a una página concreta.
  // Comprueba que la página esté dentro del rango válido.
  // Actualiza la página actual de la tabla.
  goToPage(page: number, totalPages: number): void {
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
    }
  }

  // Método para avanzar a la siguiente página.
  // Utiliza el total de páginas para evitar desbordamientos.
  // Delega la validación en goToPage.
  nextPage(totalPages: number): void {
    this.goToPage(this.currentPage + 1, totalPages);
  }

  // Método para retroceder a la página anterior.
  // Utiliza el total de páginas para validar el movimiento.
  // Delega la actualización en goToPage.
  previousPage(totalPages: number): void {
    this.goToPage(this.currentPage - 1, totalPages);
  }

  // Método para reiniciar la paginación.
  // Vuelve a la primera página cuando cambian filtros o pestañas.
  // Evita mostrar páginas vacías tras aplicar un filtro.
  resetPagination(): void {
    this.currentPage = 1;
  }

  // Método para abrir el modal de detalle de un reporte.
  // Inicializa los campos de acción y carga los detalles desde el backend.
  // Muestra estados de carga y posibles errores.
  viewReportDetail(report: AdminReport): void {
    this.selectedReportId = report.id;
    this.showDetailModal = true;
    this.loadingDetail = true;
    this.errorDetail = '';
    this.resolutionText = '';
    this.bandUser = false;
    this.rejectReason = '';

    this.reportDetail$ = this.adminService.getReportDetail(report.id).pipe(
      map((response) => response.report),
      catchError((error) => {
        this.errorDetail = error?.error?.message || 'Error al cargar detalles del reporte';
        this.loadingDetail = false;
        return of(null);
      })
    );

    // Finaliza el estado de carga cuando llega la respuesta del detalle.
    this.reportDetail$.subscribe(() => {
      this.loadingDetail = false;
    });
  }

  // Método para cerrar el modal de detalle.
  // Limpia el reporte seleccionado y los campos de acción.
  // Reinicia el observable de detalle a un valor vacío.
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedReportId = null;
    this.reportDetail$ = of(null);
    this.resolutionText = '';
    this.bandUser = false;
    this.rejectReason = '';
  }

  // Método para resolver un reporte.
  // Requiere una resolución escrita antes de enviar la acción.
  // Puede aplicar una acción adicional de baneo si está marcada.
  resolveReport(): void {
    if (!this.selectedReportId || !this.resolutionText.trim()) {
      this.errorDetail = 'Ingresa una resolución';
      return;
    }

    this.resolvingReportId = this.selectedReportId;
    this.adminService.resolveReport(this.selectedReportId, this.resolutionText, this.bandUser ? 'ban' : 'none')
      .subscribe({
        next: (response) => {
          this.successMessage = `Reporte resuelto${this.bandUser ? ' y usuario baneado' : ''}`;
          this.resolvingReportId = null;
          setTimeout(() => {
            this.successMessage = '';
            this.closeDetailModal();
            this.refreshTrigger$.next();
          }, 2000);
        },
        error: (error) => {
          this.errorDetail = error?.error?.message || 'Error al resolver reporte';
          this.resolvingReportId = null;
        }
      });
  }

  // Método para rechazar un reporte.
  // Requiere indicar previamente una razón de rechazo.
  // Si la operación tiene éxito, cierra el modal y refresca la tabla.
  rejectReportAction(): void {
    if (!this.selectedReportId || !this.rejectReason.trim()) {
      this.errorDetail = 'Ingresa una razón para rechazar';
      return;
    }

    this.rejectingReportId = this.selectedReportId;
    this.adminService.rejectReport(this.selectedReportId, this.rejectReason)
      .subscribe({
        next: (response) => {
          this.successMessage = 'Reporte rechazado';
          this.rejectingReportId = null;
          setTimeout(() => {
            this.successMessage = '';
            this.closeDetailModal();
            this.refreshTrigger$.next();
          }, 2000);
        },
        error: (error) => {
          this.errorDetail = error?.error?.message || 'Error al rechazar reporte';
          this.rejectingReportId = null;
        }
      });
  }

  // Método para marcar un reporte como bajo revisión.
  // Comprueba que exista un reporte seleccionado.
  // Actualiza el estado en el backend y recarga la lista tras el éxito.
  markUnderReview(): void {
    if (!this.selectedReportId) return;

    this.reviewingReportId = this.selectedReportId;
    this.adminService.markReportUnderReview(this.selectedReportId)
      .subscribe({
        next: (response) => {
          this.successMessage = 'Reporte marcado bajo revisión';
          this.reviewingReportId = null;
          setTimeout(() => {
            this.successMessage = '';
            this.closeDetailModal();
            this.refreshTrigger$.next();
          }, 2000);
        },
        error: (error) => {
          this.errorDetail = error?.error?.message || 'Error al marcar bajo revisión';
          this.reviewingReportId = null;
        }
      });
  }

  // Método para aplicar visualmente los filtros seleccionados.
  // Muestra un mensaje informativo con el filtro actual.
  // Después desplaza la pantalla hasta la tabla de resultados.
  applyFilter(): void {
    this.successMessage = `Filtro aplicado: ${this.activeTab} - "${this.search || 'Todo'}" - ${this.selectedFilter}`;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);

    // Desplazamiento automático hacia la tabla de resultados.
    const tableElement = document.querySelector('.table-wrapper');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}