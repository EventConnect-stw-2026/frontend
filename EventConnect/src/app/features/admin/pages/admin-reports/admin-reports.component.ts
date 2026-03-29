import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, of, switchMap } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService, AdminReport } from '../../../../core/services/admin.service';

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
export class AdminReportsComponent {
  private adminService = inject(AdminService);

  activeTab: ReportTab = 'Contenido';
  search = '';
  selectedFilter = 'Todos';

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

  reports$: Observable<AdminReportsData> = this.adminService.getReports().pipe(
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

  get summaryCards(): ReportSummary[] {
    return [];
  }

  setTab(tab: ReportTab): void {
    this.activeTab = tab;
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

  viewReport(report: AdminReport): void {
    console.log('Ver reporte', report);
  }
}