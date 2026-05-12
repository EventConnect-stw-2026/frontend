/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: favorites.component.ts
 * Descripción: Componente encargado de mostrar los eventos a los que asiste el usuario,
 * gestionar la paginación de favoritos y permitir cancelar la asistencia a eventos.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EventService } from '../../../core/services/event.service';
import { HeaderComponent } from '../../../layout/components/header/header';
import { Subscription } from 'rxjs';

// Número de eventos favoritos mostrados por página.
const PAGE_SIZE = 6;

// Componente encargado de gestionar la pantalla de favoritos.
// Carga los eventos a los que el usuario está apuntado,
// permite cancelar asistencia y navegar al detalle de cada evento.
@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit, OnDestroy {

  // Servicio de autenticación utilizado para obtener eventos asistidos.
  private authService = inject(AuthService);

  // Servicio utilizado para cancelar o alternar la asistencia a eventos.
  private eventService = inject(EventService);

  // Servicio de navegación entre pantallas.
  private router = inject(Router);

  // Referencia para forzar la detección de cambios en la vista.
  private cdr = inject(ChangeDetectorRef);

  // Lista de eventos a los que el usuario va a asistir.
  events: any[] = [];

  // Indica si se están cargando los eventos favoritos.
  loading = true;

  // Indica si ha ocurrido un error al cargar los favoritos.
  loadError = false;

  // Página actual del listado paginado.
  page = 1;

  // Suscripción activa a la carga de eventos asistidos.
  private attendingSub: Subscription | null = null;

  // Getter que devuelve los eventos visibles en la página actual.
  // Calcula el rango según PAGE_SIZE y el número de página.
  // Se usa directamente desde la plantilla.
  get paginatedEvents() {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.events.slice(start, start + PAGE_SIZE);
  }

  // Getter que calcula el número total de páginas.
  // Divide el total de eventos entre el tamaño de página.
  // Permite activar o desactivar la paginación.
  get totalPages() {
    return Math.ceil(this.events.length / PAGE_SIZE);
  }

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Solicita al backend los eventos a los que asiste el usuario.
  // Gestiona estados de carga, error y redirección si no está autenticado.
  ngOnInit() {
    console.log('[FavoritesComponent] ngOnInit() #' + Math.random().toString(36).substring(7) + ' - calling getAttending()');
    console.log('[FavoritesComponent] loading state before:', this.loading);

    this.loading = true;
    this.loadError = false;
    this.cdr.markForCheck();

    console.log('[FavoritesComponent] loading state after setting to true:', this.loading);

    // Si ya existía una suscripción previa, se cancela antes de crear otra.
    if (this.attendingSub) {
      console.log('[FavoritesComponent] Unsubscribing from previous attendingSub');
      this.attendingSub.unsubscribe();
    }

    this.attendingSub = this.authService.getAttending().subscribe({
      next: (res) => {
        console.log('[FavoritesComponent] getAttending() success:', res);
        console.log('[FavoritesComponent] setting loading=false');

        this.events = res.data ?? [];
        this.loading = false;
        this.loadError = false;

        console.log('[FavoritesComponent] events updated, loading=false, events.length=', this.events.length);

        this.cdr.markForCheck();

        console.log('[FavoritesComponent] markForCheck called');
      },
      error: (err: any) => {
        console.error('[FavoritesComponent] getAttending() error:', err);

        this.loading = false;
        this.loadError = true;
        this.cdr.markForCheck();

        // Si el backend responde 401, se envía al usuario a iniciar sesión.
        if (err.status === 401) {
          console.log('[FavoritesComponent] 401 error, navigating to login');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  // Método del ciclo de vida ejecutado al destruir el componente.
  // Cancela la suscripción activa para evitar fugas de memoria.
  // Se ejecuta al abandonar la pantalla de favoritos.
  ngOnDestroy() {
    console.log('[FavoritesComponent] ngOnDestroy - unsubscribing');

    if (this.attendingSub) {
      this.attendingSub.unsubscribe();
    }
  }

  // Método para cancelar la asistencia a un evento.
  // Detiene la propagación del clic para no abrir el detalle del evento.
  // Si el backend confirma la cancelación, elimina el evento de la lista local.
  unattend(domEvent: Event, eventId: string) {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    domEvent.stopImmediatePropagation();

    this.eventService.toggleAttend(eventId).subscribe({
      next: (res: any) => {
        console.log('toggleAttend response:', res);

        if (res.isAttending === false) {
          this.events = this.events.filter((e: any) => e._id !== eventId);

          // Si la página queda vacía tras borrar el último elemento, se retrocede una página.
          if (this.paginatedEvents.length === 0 && this.page > 1) this.page--;

          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.error('Error cancelando asistencia:', err);
      }
    });
  }

  // Método ejecutado cuando falla la carga de una imagen.
  // Sustituye la imagen rota por un placeholder local.
  // Evita tarjetas visualmente incompletas.
  onImageError(e: any) {
    e.target.src = 'assets/images/placeholder.svg';
  }

  // Método para navegar al detalle de un evento concreto.
  // Recibe el identificador del evento seleccionado.
  goToEvent(id: string) {
    this.router.navigate(['/events', id]);
  }

  // Método para ir a la página anterior de favoritos.
  // Solo retrocede si la página actual es mayor que uno.
  prevPage() {
    if (this.page > 1) this.page--;
  }

  // Método para avanzar a la página siguiente de favoritos.
  // Solo avanza si no se ha alcanzado la última página.
  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  // Método para volver a la pantalla de perfil.
  // Se ejecuta desde el botón superior de volver.
  goBack() {
    this.router.navigate(['/profile']);
  }

  // Método para navegar a la pantalla de exploración de eventos.
  // Se usa desde el estado vacío cuando no hay favoritos.
  goToExplore() {
    this.router.navigate(['/explore']);
  }
}