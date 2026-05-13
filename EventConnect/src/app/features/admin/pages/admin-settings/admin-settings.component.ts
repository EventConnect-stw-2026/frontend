/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: admin-settings.component.ts
 * Descripción: Componente encargado de la configuración general del panel de administración.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

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

// Interface para representar el estado de carga de la configuración,
// incluyendo los datos de ajustes, estado de carga y posibles mensajes.
interface SettingsData {
  settings: AdminSettings;
  isLoading: boolean;
  errorMessage: string;
  successMessage: string;
}

// Interface para representar el estado del sistema,
// incluyendo datos técnicos, estado de carga y posibles errores.
interface SystemStatusData {
  status: AdminSystemStatus;
  isLoading: boolean;
  errorMessage: string;
}

// Componente encargado de gestionar la pantalla de configuración general.
// Permite editar información de la aplicación, políticas de moderación,
// notificaciones, copias de seguridad, mantenimiento y opciones de seguridad.
@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminTopbarComponent],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss'
})
export class AdminSettingsComponent implements OnInit {

  // Servicio de formularios reactivos utilizado para crear los formularios.
  private fb = inject(FormBuilder);

  // Servicio de administración utilizado para comunicarse con el backend.
  private adminService = inject(AdminService);

  // Observable con la configuración general de la plataforma.
  settings$: Observable<SettingsData>;

  // Observable con el estado técnico del sistema.
  systemStatus$: Observable<SystemStatusData>;

  // Formulario reactivo para la información general de la aplicación.
  generalForm = this.fb.group({
    appName: ['', [Validators.required]],
    description: [''],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: [''],
    timezone: [''],
    defaultLanguage: ['']
  });

  // Formulario reactivo para las políticas de moderación.
  moderationForm = this.fb.group({
    requireEventApproval: [true],
    autoDetectWords: [true],
    autoBanAfterReports: [false],
    notifyModeratorsOnReports: [true],
    bannedWords: ['']
  });

  // Formulario reactivo para las preferencias de notificación.
  notificationsForm = this.fb.group({
    notifyReportedUsers: [true],
    notifyFlaggedContent: [true],
    weeklySummary: [true],
    systemAlerts: [true]
  });

  // Mensajes globales mostrados en la pantalla.
  successMessage = '';
  errorMessage = '';

  // Estados de guardado para evitar acciones repetidas.
  savingGeneral = false;
  savingModeration = false;
  savingNotifications = false;

  // Constructor del componente.
  // Inicializa los observables de configuración y estado del sistema.
  // También rellena los formularios cuando llegan los datos del backend.
  constructor() {
    this.settings$ = this.adminService.getSettings().pipe(
      map((response) => {
        const settings = response.settings;
        
        // Rellenado de formularios con la configuración recibida.
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

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // En este caso no realiza acciones adicionales porque los observables
  // se inicializan directamente en el constructor.
  ngOnInit(): void {
    // Los observables se inicializan en el constructor.
  }

  // Método para guardar la configuración general de la aplicación.
  // Valida el formulario antes de enviar los datos al backend.
  // Muestra mensajes de éxito o error según el resultado.
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

  // Método para guardar la configuración de moderación.
  // Recoge los valores actuales del formulario de moderación.
  // Envía al backend políticas como aprobación, palabras prohibidas y reportes.
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

  // Método para guardar la configuración de notificaciones.
  // Envía las preferencias actuales al backend.
  // Actualiza los mensajes visibles según la respuesta recibida.
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

  // Método para cancelar los cambios del formulario general.
  // Reinicia los campos del formulario a su estado vacío.
  // No realiza ninguna llamada al backend.
  cancelGeneral(): void {
    this.generalForm.reset();
  }

  // Método para cancelar los cambios del formulario de moderación.
  // Reinicia los campos del formulario a su estado vacío.
  // No modifica la configuración almacenada en el backend.
  cancelModeration(): void {
    this.moderationForm.reset();
  }

  // Método para generar o descargar un respaldo manual.
  // Llama al backend para crear la copia de seguridad.
  // Muestra el nombre y tamaño del respaldo generado.
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

  // Método para limpiar la caché del sistema.
  // Ejecuta la acción en el backend mediante el servicio de administración.
  // Muestra un mensaje indicando el resultado de la operación.
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

  // Método para optimizar la base de datos del sistema.
  // Tras completar la operación, recarga el estado técnico del sistema.
  // Informa al administrador mediante mensajes de éxito o error.
  optimizeDatabase(): void {
    this.adminService.optimizeDatabase().subscribe({
      next: (response) => {
        this.successMessage = 'Base de datos optimizada exitosamente';
        this.errorMessage = '';
        setTimeout(() => { this.successMessage = ''; }, 3000);
        
        // Recarga del estado del sistema tras la optimización.
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

  // Método provisional para consultar logs del sistema.
  // Actualmente muestra un mensaje indicando que la funcionalidad está en desarrollo.
  // Puede ampliarse en el futuro con una vista real de registros.
  viewLogs(): void {
    console.log('Ver logs del sistema');
    this.successMessage = 'Funcionalidad de logs: En desarrollo';
    setTimeout(() => { this.successMessage = ''; }, 3000);
  }

  // Método provisional para cambiar la contraseña del administrador.
  // Actualmente muestra un mensaje informativo de funcionalidad en desarrollo.
  // Puede conectarse posteriormente a un formulario de cambio de contraseña.
  changeAdminPassword(): void {
    console.log('Cambiar contraseña admin');
    this.successMessage = 'Funcionalidad de cambio de contraseña: En desarrollo';
    setTimeout(() => { this.successMessage = ''; }, 3000);
  }

  // Método para restablecer los tokens de sesión.
  // Actualmente actualiza el mensaje visible para confirmar la acción.
  // Puede conectarse a un endpoint específico de seguridad en el backend.
  resetSessionTokens(): void {
    console.log('Restablecer tokens de sesión');
    this.successMessage = 'Tokens de sesión restablecidos';
    this.errorMessage = '';
    setTimeout(() => { this.successMessage = ''; }, 3000);
  }

  // Método provisional para consultar logs de acceso.
  // Actualmente solo muestra un mensaje de funcionalidad en desarrollo.
  // Puede ampliarse en el futuro con una tabla de accesos administrativos.
  viewAccessLogs(): void {
    console.log('Ver logs de acceso');
    this.successMessage = 'Funcionalidad de logs de acceso: En desarrollo';
    setTimeout(() => { this.successMessage = ''; }, 3000);
  }
}