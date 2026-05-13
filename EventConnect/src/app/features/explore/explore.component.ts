/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: explore.component.ts
 * Descripción: Componente encargado de mostrar la pantalla de exploración de eventos,
 * permitiendo buscar, filtrar por categoría y fecha, y navegar entre páginas de resultados.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { HeaderComponent } from '../../layout/components/header/header';
import { StripHtmlPipe } from '../../shared/pipes/strip-html.pipe';

// Componente encargado de gestionar la exploración de eventos.
// Carga eventos desde el backend y permite aplicar filtros
// de búsqueda, categoría, fechas y paginación.
@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, StripHtmlPipe],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss',
})
export class ExploreComponent implements OnInit {

  // Lista de eventos mostrados en la página actual.
  events: any[] = [];

  // Indica si los eventos se están cargando.
  loading = true;

  // Indica si ha ocurrido un error al recuperar los eventos.
  error = false;

  // Texto introducido por el usuario en el buscador.
  searchText = '';

  // Categoría seleccionada actualmente como filtro.
  selectedCategory = '';

  // Fecha mínima seleccionada para filtrar eventos.
  dateFrom = '';

  // Fecha máxima seleccionada para filtrar eventos.
  dateTo = '';

  // Página actual del listado paginado.
  page = 1;

  // Número total de páginas disponibles.
  totalPages = 1;

  // Categorías disponibles para filtrar los eventos.
  categories = [
    'Deporte',
    'Música',
    'Teatro y Artes Escénicas',
    'Artes plásticas',
    'Cursos y Talleres',
    'Formación',
    'Ocio y Juegos',
    'Turismo',
    'Gastronomía',
    'Aire Libre y Excursiones',
    'Medio Ambiente y Naturaleza',
    'Conferencias y Congresos',
    'Imagen y sonido',
    'Idiomas',
    'Desarrollo personal',
    'Otros',
  ];

  // Servicio utilizado para consultar eventos desde el backend.
  private eventService = inject(EventService);

  // Identificador de plataforma usado para ejecutar la carga solo en navegador.
  private platformId = inject(PLATFORM_ID);

  // Referencia para forzar la detección de cambios al actualizar la vista.
  private cdr = inject(ChangeDetectorRef);

  // Imagen por defecto usada cuando un evento no tiene imagen o falla su carga.
  defaultImage = 'assets/images/placeholder.svg';

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Comprueba que la ejecución sea en navegador.
  // Si es así, lanza la primera carga de eventos.
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) this.loadEvents();
  }

  // Método para obtener la imagen que debe mostrarse en una tarjeta de evento.
  // Si el evento no tiene imageUrl, devuelve una imagen local por defecto.
  // Evita que se muestre una imagen rota en la interfaz.
  getImage(event: any): string {
    if (!event?.imageUrl) {
      return this.defaultImage;
    }
    return event?.imageUrl;
  }

  // Método ejecutado cuando falla la carga de una imagen.
  // Sustituye la imagen fallida por el placeholder local.
  // Mejora la presentación visual de las tarjetas de evento.
  onImageError(e: any) {
    e.target.src = this.defaultImage;
  }

  // Método para cargar eventos desde el backend.
  // Construye el objeto de filtros según búsqueda, categoría y fechas.
  // Actualiza eventos, paginación y estados de carga o error.
  loadEvents() {
    this.loading = true;

    const filters: any = {};
    if (this.selectedCategory) filters.category = this.selectedCategory;
    if (this.searchText) filters.search = this.searchText;
    if (this.dateFrom) filters.dateFrom = this.dateFrom;
    if (this.dateTo) filters.dateTo = this.dateTo;

    this.eventService.getEvents(this.page, 9, filters).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.events = res.data;
          this.totalPages = res.totalPages;
          this.loading = false;
          this.cdr.detectChanges();
        }, 0);
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Método para seleccionar o deseleccionar una categoría.
  // Si se pulsa la misma categoría activa, se limpia el filtro.
  // Reinicia la paginación y recarga los eventos.
  selectCategory(cat: string) {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
    this.page = 1;
    this.loadEvents();
  }

  // Método ejecutado al realizar una búsqueda por texto.
  // Reinicia la paginación para mostrar resultados desde la primera página.
  // Después recarga el listado aplicando el término buscado.
  onSearch() {
    this.page = 1;
    this.loadEvents();
  }

  // Método ejecutado al cambiar el rango de fechas.
  // Reinicia la página actual y vuelve a consultar eventos.
  // Aplica las fechas seleccionadas como filtros temporales.
  onDateChange() {
    this.page = 1;
    this.loadEvents();
  }

  // Método para limpiar los filtros de fecha.
  // Vacía los campos desde y hasta, reinicia la paginación
  // y recarga el listado sin rango temporal.
  clearDates() {
    this.dateFrom = '';
    this.dateTo = '';
    this.page = 1;
    this.loadEvents();
  }

  // Método para retroceder a la página anterior.
  // Solo actúa si la página actual es mayor que uno.
  // Después recarga los eventos correspondientes.
  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadEvents();
    }
  }

  // Método para avanzar a la página siguiente.
  // Solo actúa si todavía quedan páginas disponibles.
  // Después recarga los eventos correspondientes.
  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadEvents();
    }
  }
}