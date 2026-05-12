/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: profile-view.component.ts
 * Descripción: Componente encargado de mostrar el perfil del usuario, incluyendo datos personales,
 * intereses, navegación a secciones de cuenta, cierre de sesión y reporte de usuario.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReportService } from '../../../core/services/report.service';
import { HeaderComponent } from '../../../layout/components/header/header';
import { Subscription } from 'rxjs';

// Modelo local con los datos principales del perfil del usuario.
interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  interests?: string[];
}

// Componente encargado de gestionar la vista del perfil.
// Carga los datos del usuario autenticado, muestra sus intereses,
// permite navegar a otras secciones y cerrar sesión.
@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss'
})
export class ProfileViewComponent implements OnInit, OnDestroy {

  // Servicio de autenticación utilizado para cargar perfil y cerrar sesión.
  private authService = inject(AuthService);

  // Servicio usado para renderizar SVGs inline de forma segura.
  private sanitizer = inject(DomSanitizer);

  // Servicio de navegación entre pantallas.
  private router = inject(Router);

  // Servicio utilizado para enviar reportes de usuario al backend.
  private reportService = inject(ReportService);

  // Referencia para forzar la detección de cambios al actualizar datos.
  private cdr = inject(ChangeDetectorRef);

  // Controla la visibilidad del modal de reporte.
  reportVisible = false;

  // Motivo seleccionado para reportar al usuario.
  reportReason = 'other';

  // Descripción opcional introducida en el reporte.
  reportDescription = '';

  // Indica si se está cargando la información del perfil.
  loading = true;

  // Indica si ha ocurrido un error al cargar el perfil.
  loadError = false;

  // Suscripción activa a la carga del perfil.
  private profileSub: Subscription | null = null;

  // Datos del usuario mostrados en la pantalla.
  user: UserProfile = {
    name: '',
    email: '',
    username: '',
    avatarUrl: 'assets/images/default-avatar.svg',
    interests: []
  };

  // Método para abrir el modal de reporte del usuario.
  // Solo se permite abrirlo si existe un usuario con identificador.
  // Reinicia los campos del formulario de reporte.
  openReportUser() {
    if (!this.user || !this.user._id) return;

    this.reportVisible = true;
    this.reportReason = 'other';
    this.reportDescription = '';
  }

  // Método para enviar un reporte sobre el usuario mostrado.
  // Construye el payload con tipo, usuario implicado, razón y descripción.
  // Si se envía correctamente, cierra el modal y muestra feedback básico.
  submitUserReport() {
    if (!this.user || !this.user._id) return;

    const payload = {
      type: 'user',
      involvedUserId: this.user._id,
      reason: this.reportReason,
      description: this.reportDescription
    };

    this.reportService.createReport(payload).subscribe({
      next: () => {
        this.reportVisible = false;
        alert('Reporte enviado. Gracias.');
      },
      error: () => alert('Error enviando reporte')
    });
  }

  // Método para obtener el SVG correspondiente a un interés.
  // Sanitiza el HTML para poder insertarlo en la plantilla.
  // Si la clave no existe, devuelve una cadena vacía.
  getSvg(key: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.interestSvgs[key] ?? '');
  }

  // Diccionario de SVGs usados como iconos de intereses del usuario.
  readonly interestSvgs: Record<string, string> = {
    culture: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><circle cx="9" cy="10" r="6"/><path d="M12.5 10a3.5 3.5 0 0 1-7 0"/><circle cx="17" cy="10" r="4"/><path d="M19.5 10a2.5 2.5 0 0 1-5 0"/><path d="M15 16.5c1 1 2.5 1.5 4 1"/><path d="M9 17c1.5 1.5 4 2 6 1.5"/></svg>`,
    sports: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
    family: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    solidarity: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M18 11V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1"/><path d="M14 10V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 9.9V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/><path d="M6 14v0a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-3a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2"/></svg>`,
    education: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    gastronomy: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7"/></svg>`,
    wellness: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  };

  // Diccionario que traduce las claves internas de intereses a etiquetas visibles.
  readonly interestLabels: Record<string, string> = {
    culture:    'Cultura',
    sports:     'Deporte',
    family:     'Familia',
    solidarity: 'Solidario',
    education:  'Educación',
    gastronomy: 'Gastronomía',
    wellness:   'Bienestar',
  };

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Solicita el perfil al backend, actualiza los datos visibles
  // y gestiona redirección a login si la sesión no es válida.
  ngOnInit(): void {
    console.log('[ProfileViewComponent] ngOnInit() #' + Math.random().toString(36).substring(7) + ' - calling getProfile()');
    console.log('[ProfileViewComponent] loading state before:', this.loading);

    this.loading = true;
    this.loadError = false;

    console.log('[ProfileViewComponent] loading state after setting to true:', this.loading);

    this.cdr.markForCheck();

    // Si ya existía una suscripción previa, se cancela antes de crear otra.
    if (this.profileSub) {
      console.log('[ProfileViewComponent] Unsubscribing from previous profileSub');
      this.profileSub.unsubscribe();
    }

    this.profileSub = this.authService.getProfile().subscribe({
      next: (profile: UserProfile) => {
        console.log('[ProfileViewComponent] getProfile() success:', profile);
        console.log('[ProfileViewComponent] setting loading=false');

        this.user = {
          _id: profile._id ?? '',
          name: profile.name ?? 'Usuario',
          email: profile.email ?? '',
          username: profile.username ?? '',
          avatarUrl: profile.avatarUrl ?? 'assets/images/default-avatar.svg',
          bio: profile.bio ?? '',
          location: profile.location ?? '',
          interests: profile.interests ?? ['culture', 'sports', 'family']
        };

        console.log('[ProfileViewComponent] user updated:', this.user);

        this.loading = false;
        this.loadError = false;

        console.log('[ProfileViewComponent] loading is now:', this.loading);

        this.cdr.markForCheck();

        console.log('[ProfileViewComponent] markForCheck called');
      },
      error: (err: any) => {
        console.error('[ProfileViewComponent] getProfile() error:', err);

        this.loadError = true;
        this.cdr.markForCheck();

        // Si el backend devuelve 401, se redirige al usuario a iniciar sesión.
        if (err.status === 401) {
          console.log('[ProfileViewComponent] 401 error, navigating to login');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  // Método del ciclo de vida ejecutado al destruir el componente.
  // Cancela la suscripción activa para evitar fugas de memoria.
  ngOnDestroy(): void {
    console.log('[ProfileViewComponent] ngOnDestroy - unsubscribing');

    if (this.profileSub) {
      this.profileSub.unsubscribe();
    }
  }

  // Método para navegar a la pantalla de edición de perfil.
  goToEditProfile(): void {
    this.router.navigate(['/profile/edit']);
  }

  // Método para navegar a la pantalla de eventos favoritos.
  goToFavorites(): void {
    this.router.navigate(['/favorites']);
  }

  // Método para navegar a la pantalla de historial de eventos.
  goToHistory(): void {
    this.router.navigate(['/history']);
  }

  // Método para navegar a la pantalla de estadísticas del usuario.
  goToStats(): void {
    this.router.navigate(['/stats']);
  }

  // Método para cerrar sesión.
  // Limpia el usuario local, llama al servicio de autenticación
  // y redirige al usuario a la pantalla de login.
  logout(): void {
    this.user = {
      name: '',
      email: '',
      username: '',
      avatarUrl: '',
      bio: '',
      location: '',
      interests: []
    };

    this.authService.logout();
    this.router.navigate(['/login']);
  }
}