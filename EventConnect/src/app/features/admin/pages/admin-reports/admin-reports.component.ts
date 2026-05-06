import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService, AdminReport, AdminReportDetail } from '../../../../core/services/admin.service';

type ReportTab = 'Contenido' | 'Usuarios' | 'Eventos';

interface ReportSummary {
  value: number;
  label: string;
  icon: string;
  variant: 'danger' | 'warning' | 'soft-warning';
}

interface AdminReportsData {
  reports: AdminReport[];
  isLoading: boolean;
  errorMessage: string;
}

interface AdminReportsSummaryData {
  summaryCards: ReportSummary[];
  isLoading: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTopbarComponent],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss'
})
export class AdminReportsComponent implements OnInit {
  private adminService = inject(AdminService);

  activeTab: ReportTab = 'Contenido';
  search = '';
  selectedFilter = 'Todos';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;

  // Para modal de detalles
  showDetailModal = false;
  selectedReportId: string | null = null;
  reportDetail$: Observable<AdminReportDetail | null> = of(null);
  loadingDetail = false;
  errorDetail = '';

  // Para acciones
  resolvingReportId: string | null = null;
  rejectingReportId: string | null = null;
  reviewingReportId: string | null = null;
  resolutionText = '';
  bandUser = false;
  rejectReason = '';
  successMessage = '';
  errorMessage = '';

  private refreshTrigger$ = new BehaviorSubject<void>(void 0);

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

  ngOnInit(): void {
    this.refreshTrigger$.next();
  }

  get summaryCards(): ReportSummary[] {
    return [];
  }

  setTab(tab: ReportTab): void {
    this.activeTab = tab;
    this.resetPagination();
  }

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

  getPaginatedReports(reports: AdminReport[]): AdminReport[] {
    const filtered = this.getFilteredReports(reports);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  getTotalPages(reports: AdminReport[]): number {
    const filtered = this.getFilteredReports(reports);
    return Math.max(1, Math.ceil(filtered.length / this.pageSize));
  }

  goToPage(page: number, totalPages: number): void {
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(totalPages: number): void {
    this.goToPage(this.currentPage + 1, totalPages);
  }

  previousPage(totalPages: number): void {
    this.goToPage(this.currentPage - 1, totalPages);
  }

  resetPagination(): void {
    this.currentPage = 1;
  }

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

    this.reportDetail$.subscribe(() => {
      this.loadingDetail = false;
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedReportId = null;
    this.reportDetail$ = of(null);
    this.resolutionText = '';
    this.bandUser = false;
    this.rejectReason = '';
  }

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

  applyFilter(): void {
    this.successMessage = `Filtro aplicado: ${this.activeTab} - "${this.search || 'Todo'}" - ${this.selectedFilter}`;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
    // Scroll a la tabla de resultados
    const tableElement = document.querySelector('.table-wrapper');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
