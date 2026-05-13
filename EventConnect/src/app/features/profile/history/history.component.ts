/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: history.component.ts
 * Descripción: Componente encargado de mostrar el historial de eventos asistidos por el usuario,
 * filtrando eventos pasados, gestionando la paginación y controlando estados de carga y error.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../layout/components/header/header';
import { Subscription } from 'rxjs';

// Número de eventos mostrados por página en la vista de historial.
const PAGE_SIZE = 6;

// Componente encargado de gestionar la pantalla de historial.
// Carga los eventos asistidos por el usuario,
// conserva solo los eventos pasados y permite navegar por páginas.
@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent],
  providers: [],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit, OnDestroy {

  // Servicio de autenticación utilizado para consultar el historial del usuario.
  private authService = inject(AuthService);

  // Servicio de navegación entre pantallas.
  private router = inject(Router);

  // Referencia para forzar la detección de cambios al actualizar datos.
  private cdr = inject(ChangeDetectorRef);

  // Lista de eventos pasados mostrados en el historial.
  events: any[] = [];

  // Indica si se está cargando el historial.
  loading = true;

  // Indica si ha ocurrido un error al cargar el historial.
  loadError = false;

  // Página actual del listado paginado.
  page = 1;

  // Suscripción activa a la carga del historial.
  private historySub: Subscription | null = null;

  // Getter que devuelve los eventos visibles en la página actual.
  // Calcula el rango usando PAGE_SIZE y el número de página.
  // Se usa directamente desde la plantilla.
  get paginatedEvents() {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.events.slice(start, start + PAGE_SIZE);
  }

  // Getter que calcula el número total de páginas.
  // Divide el número de eventos entre el tamaño de página.
  // Permite controlar la paginación de la vista.
  get totalPages() {
    return Math.ceil(this.events.length / PAGE_SIZE);
  }

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Solicita al backend el historial del usuario autenticado.
  // Filtra los eventos para mostrar únicamente aquellos cuya fecha ya ha pasado.
  ngOnInit() {
    console.log('[HistoryComponent] ngOnInit() #' + Math.random().toString(36).substring(7) + ' - calling getHistory()');
    console.log('[HistoryComponent] loading state before:', this.loading);

    this.loading = true;
    this.loadError = false;
    this.cdr.markForCheck();

    console.log('[HistoryComponent] loading state after setting to true:', this.loading);

    // Si ya existía una suscripción previa, se cancela antes de crear otra.
    if (this.historySub) {
      console.log('[HistoryComponent] Unsubscribing from previous historySub');
      this.historySub.unsubscribe();
    }

    this.historySub = this.authService.getHistory().subscribe({
      next: (res) => {
        console.log('[HistoryComponent] getHistory() success:', res);
        console.log('[HistoryComponent] setting loading=false');

        const now = new Date();

        // El historial solo muestra eventos cuya fecha de inicio ya ha pasado.
        this.events = (res.data ?? []).filter(
          (e: any) => e.startDate && new Date(e.startDate) < now
        );

        this.loading = false;
        this.loadError = false;

        console.log('[HistoryComponent] events updated, loading=false, events.length=', this.events.length);

        this.cdr.markForCheck();

        console.log('[HistoryComponent] markForCheck called');
      },
      error: (err: any) => {
        console.error('[HistoryComponent] getHistory() error:', err);

        this.loading = false;
        this.loadError = true;
        this.cdr.markForCheck();

        // Si el usuario no está autenticado, se redirige a la pantalla de login.
        if (err.status === 401) {
          console.log('[HistoryComponent] 401 error, navigating to login');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  // Método del ciclo de vida ejecutado al destruir el componente.
  // Cancela la suscripción activa para evitar fugas de memoria.
  // Se ejecuta al salir de la pantalla de historial.
  ngOnDestroy() {
    console.log('[HistoryComponent] ngOnDestroy - unsubscribing');

    if (this.historySub) {
      this.historySub.unsubscribe();
    }
  }

  // Método ejecutado cuando falla la carga de una imagen.
  // Sustituye la imagen rota por un placeholder local.
  // Evita que las tarjetas del historial aparezcan incompletas.
  onImageError(e: any) {
    e.target.src = 'assets/images/placeholder.svg';
  }

  // Método para retroceder a la página anterior del historial.
  // Solo actúa si la página actual es mayor que uno.
  prevPage() {
    if (this.page > 1) this.page--;
  }

  // Método para avanzar a la página siguiente del historial.
  // Solo actúa si todavía quedan páginas disponibles.
  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  // Método para volver a la pantalla de perfil.
  // Se ejecuta desde el botón superior de volver.
  goBack() {
    this.router.navigate(['/profile']);
  }

  // Método para navegar a la pantalla de exploración de eventos.
  // Se usa desde el estado vacío cuando no hay historial.
  goToExplore() {
    this.router.navigate(['/explore']);
  }
}