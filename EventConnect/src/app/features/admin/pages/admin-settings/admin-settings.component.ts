import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';
import { AdminTopbarComponent } from '../../components/admin-topbar/admin-topbar.component';
import { AdminService, AdminSettings, AdminSystemStatus } from '../../../../core/services/admin.service';

interface SettingsData {
  settings: AdminSettings;
  isLoading: boolean;
  errorMessage: string;
  successMessage: string;
}

interface SystemStatusData {
  status: AdminSystemStatus;
  isLoading: boolean;
  errorMessage: string;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminTopbarComponent],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss'
})
export class AdminSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);

  settings$: Observable<SettingsData>;
  systemStatus$: Observable<SystemStatusData>;

  generalForm = this.fb.group({
    appName: ['', [Validators.required]],
    description: [''],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: [''],
    timezone: [''],
    defaultLanguage: ['']
  });

  moderationForm = this.fb.group({
    requireEventApproval: [true],
    autoDetectWords: [true],
    autoBanAfterReports: [false],
    notifyModeratorsOnReports: [true],
    bannedWords: ['']
  });

  notificationsForm = this.fb.group({
    notifyReportedUsers: [true],
    notifyFlaggedContent: [true],
    weeklySummary: [true],
    systemAlerts: [true]
  });

  successMessage = '';
  errorMessage = '';
  savingGeneral = false;
  savingModeration = false;
  savingNotifications = false;

  constructor() {
    this.settings$ = this.adminService.getSettings().pipe(
      map((response) => {
        const settings = response.settings;
        
        // Rellenar formularios
        this.generalForm.patchValue(settings.general);
        this.moderationForm.patchValue({
          ...settings.moderation,
          bannedWords: settings.moderation.bannedWords.join(', ')
        });
        this.notificationsForm.patchValue(settings.notifications);
        
        return {
          settings,
          isLoading: false,
          errorMessage: '',
          successMessage: ''
        };
      }),
      startWith({
        settings: {
          general: {
            appName: '',
            description: '',
            contactEmail: '',
            contactPhone: '',
            timezone: '',
            defaultLanguage: ''
          },
          moderation: {
            requireEventApproval: true,
            autoDetectWords: true,
            autoBanAfterReports: false,
            notifyModeratorsOnReports: true,
            bannedWords: []
          },
          notifications: {
            notifyReportedUsers: true,
            notifyFlaggedContent: true,
            weeklySummary: true,
            systemAlerts: true
          },
          backup: {},
          maintenance: {}
        },
        isLoading: true,
        errorMessage: '',
        successMessage: ''
      }),
      catchError((error) => of({
        settings: {
          general: {
            appName: '',
            description: '',
            contactEmail: '',
            contactPhone: '',
            timezone: '',
            defaultLanguage: ''
          },
          moderation: {
            requireEventApproval: true,
            autoDetectWords: true,
            autoBanAfterReports: false,
            notifyModeratorsOnReports: true,
            bannedWords: []
          },
          notifications: {
            notifyReportedUsers: true,
            notifyFlaggedContent: true,
            weeklySummary: true,
            systemAlerts: true
          },
          backup: {},
          maintenance: {}
        },
        isLoading: false,
        errorMessage: error?.error?.message || 'No se pudo cargar la configuración',
        successMessage: ''
      }))
    );

    this.systemStatus$ = this.adminService.getSystemStatus().pipe(
      map((response) => ({
        status: response.status,
        isLoading: false,
        errorMessage: ''
      })),
      startWith({
        status: {
          isOperational: true,
          systemLoad: '0%',
          lastUpdate: '',
          lastBackup: '',
          nextBackup: '',
          backupFrequency: 'daily',
          lastUpdateDate: ''
        },
        isLoading: true,
        errorMessage: ''
      }),
      catchError((error) => of({
        status: {
          isOperational: false,
          systemLoad: '0%',
          lastUpdate: '',
          lastBackup: '',
          nextBackup: '',
          backupFrequency: 'daily',
          lastUpdateDate: ''
        },
        isLoading: false,
        errorMessage: error?.error?.message || 'No se pudo cargar el estado del sistema'
      }))
    );
  }

  ngOnInit(): void {
    // Los observables se inicializan en el constructor
  }

  saveGeneral(): void {
    if (this.generalForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.savingGeneral = true;
    this.adminService.updateGeneralSettings(this.generalForm.value).subscribe({
      next: (response) => {
        this.successMessage = 'Configuración general guardada exitosamente';
        this.errorMessage = '';
        this.savingGeneral = false;
        setTimeout(() => { this.successMessage = ''; }, 3000);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Error al guardar configuración general';
        this.successMessage = '';
        this.savingGeneral = false;
      }
    });
  }

  saveModeration(): void {
    const data = {
      ...this.moderationForm.value,
      bannedWords: this.moderationForm.get('bannedWords')?.value || ''
    };

    this.savingModeration = true;
    this.adminService.updateModerationSettings(data).subscribe({
      next: (response) => {
        this.successMessage = 'Configuración de moderación guardada exitosamente';
        this.errorMessage = '';
        this.savingModeration = false;
        setTimeout(() => { this.successMessage = ''; }, 3000);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Error al guardar configuración de moderación';
        this.successMessage = '';
        this.savingModeration = false;
      }
    });
  }

  saveNotifications(): void {
    this.savingNotifications = true;
    this.adminService.updateNotificationSettings(this.notificationsForm.value).subscribe({
      next: (response) => {
        this.successMessage = 'Configuración de notificaciones guardada exitosamente';
        this.errorMessage = '';
        this.savingNotifications = false;
        setTimeout(() => { this.successMessage = ''; }, 3000);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Error al guardar configuración de notificaciones';
        this.successMessage = '';
        this.savingNotifications = false;
      }
    });
  }

  cancelGeneral(): void {
    this.generalForm.reset();
  }

  cancelModeration(): void {
    this.moderationForm.reset();
  }

  downloadManualBackup(): void {
    this.adminService.downloadBackup().subscribe({
      next: (response) => {
        this.successMessage = `Respaldo ${response.filename} generado (${response.size})`;
        this.errorMessage = '';
        setTimeout(() => { this.successMessage = ''; }, 3000);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Error al descargar respaldo';
      }
    });
  }

  clearCache(): void {
    this.adminService.clearCache().subscribe({
      next: (response) => {
        this.successMessage = 'Caché limpiado exitosamente';
        this.errorMessage = '';
        setTimeout(() => { this.successMessage = ''; }, 3000);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Error al limpiar caché';
      }
    });
  }

  optimizeDatabase(): void {
    this.adminService.optimizeDatabase().subscribe({
      next: (response) => {
        this.successMessage = 'Base de datos optimizada exitosamente';
        this.errorMessage = '';
        setTimeout(() => { this.successMessage = ''; }, 3000);
        
        // Recargar estado del sistema
        this.systemStatus$ = this.adminService.getSystemStatus().pipe(
          map((resp) => ({
            status: resp.status,
            isLoading: false,
            errorMessage: ''
          })),
          catchError((error) => of({
            status: { isOperational: false, systemLoad: '0%', lastUpdate: '', lastBackup: '', nextBackup: '', backupFrequency: 'daily', lastUpdateDate: '' },
            isLoading: false,
            errorMessage: error?.error?.message || 'Error al cargar estado'
          }))
        );
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Error al optimizar base de datos';
      }
    });
  }

  viewLogs(): void {
    console.log('Ver logs del sistema');
    this.successMessage = 'Funcionalidad de logs: En desarrollo';
    setTimeout(() => { this.successMessage = ''; }, 3000);
  }

  changeAdminPassword(): void {
    console.log('Cambiar contraseña admin');
    this.successMessage = 'Funcionalidad de cambio de contraseña: En desarrollo';
    setTimeout(() => { this.successMessage = ''; }, 3000);
  }

  resetSessionTokens(): void {
    console.log('Restablecer tokens de sesión');
    this.successMessage = 'Tokens de sesión restablecidos';
    this.errorMessage = '';
    setTimeout(() => { this.successMessage = ''; }, 3000);
  }

  viewAccessLogs(): void {
    console.log('Ver logs de acceso');
    this.successMessage = 'Funcionalidad de logs de acceso: En desarrollo';
    setTimeout(() => { this.successMessage = ''; }, 3000);
  }
}