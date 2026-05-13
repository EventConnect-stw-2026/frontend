/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: map.component.ts
 * Descripción: Componente encargado de mostrar el mapa de eventos, gestionar marcadores,
 * búsquedas de ubicaciones, selección de eventos y panel informativo asociado.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import { Component, OnInit, inject, PLATFORM_ID, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../core/services/event.service';
import { HeaderComponent } from '../../layout/components/header/header';

// Componente encargado de gestionar el mapa interactivo de eventos.
// Carga eventos con coordenadas, crea marcadores personalizados
// y permite buscar ubicaciones mediante Nominatim.
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, DatePipe, FormsModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit {

  // Lista de eventos con coordenadas que se mostrarán en el mapa.
  events: any[] = [];

  // Evento actualmente seleccionado desde un marcador.
  selectedEvent: any = null;

  // Identificador de plataforma usado para ejecutar lógica solo en navegador.
  private platformId = inject(PLATFORM_ID);

  // Servicio utilizado para consultar eventos desde el backend.
  private eventService = inject(EventService);

  // Referencia para forzar la detección de cambios al actualizar la vista.
  private cdr = inject(ChangeDetectorRef);

  // Instancia principal del mapa Leaflet.
  private map: any;

  // Texto introducido por el usuario en el buscador de ubicaciones.
  searchQuery = '';

  // Resultados devueltos por la búsqueda de Nominatim.
  searchResults: any[] = [];

  // Temporizador usado para aplicar debounce a la búsqueda.
  private searchTimeout: any;

  // Marcador temporal que indica la ubicación seleccionada en el buscador.
  private searchMarker: any = null;

  // SVGs inline utilizados para construir marcadores según la categoría del evento.
  categorySvgs: Record<string, string> = {
    'Deporte':     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
    'Deportivo':   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
    'Música':      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    'Cultural':    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M5 20V8l7-6 7 6v12"/><path d="M9 20v-5h6v5"/></svg>`,
    'Cultura':     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M5 20V8l7-6 7 6v12"/><path d="M9 20v-5h6v5"/></svg>`,
    'Social':      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    'Educativo':   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    'Gastronómico':`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7"/></svg>`,
    'Empresarial': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>`,
    'Religioso':   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 22V10L12 2 6 10v12"/><path d="M12 2v8"/><path d="M6 10h12"/></svg>`,
    'default':     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  };

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Carga eventos desde el backend y conserva solo los que tienen coordenadas.
  // Si el mapa ya está creado, añade los marcadores inmediatamente.
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.eventService.getEvents(1, 200).subscribe({
        next: (res) => {
          this.events = res.data.filter((e: any) => e.latitude && e.longitude);
          if (this.map) this.addMarkers();
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Método ejecutado después de inicializar la vista.
  // Crea el mapa de Leaflet centrado en Zaragoza y añade la capa de OpenStreetMap.
  // También registra el reajuste de tamaño de marcadores al cambiar el zoom.
  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');

      this.map = L.map('map', { center: [41.6488, -0.8891], zoom: 13 });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(this.map);

      this.map.on('zoomend', () => {
        this.updateMarkerSizes();
      });

      if (this.events.length) this.addMarkers();
    }
  }

  // Método ejecutado cada vez que cambia el texto del buscador.
  // Aplica debounce para no lanzar búsquedas continuas.
  // Solo busca cuando el texto tiene al menos tres caracteres.
  onSearchInput() {
    clearTimeout(this.searchTimeout);

    if (this.searchQuery.length < 3) {
      this.searchResults = [];
      return;
    }

    this.searchTimeout = setTimeout(() => this.searchPlace(), 400);
  }

  // Método para buscar una ubicación usando Nominatim.
  // Construye la URL con el texto escrito y limita los resultados a España.
  // Guarda los resultados para mostrarlos en el desplegable.
  async searchPlace() {
    if (!this.searchQuery.trim()) return;

    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(this.searchQuery)}` +
      `&format=json&limit=5&countrycodes=es` +
      `&accept-language=es`;

    try {
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      this.searchResults = await res.json();
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error buscando:', e);
    }
  }

  // Método para seleccionar un resultado del buscador.
  // Añade un marcador temporal en la ubicación encontrada
  // y desplaza el mapa suavemente hasta sus coordenadas.
  async selectResult(result: any) {
    const L = await import('leaflet');
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (this.searchMarker) this.searchMarker.remove();

    this.searchMarker = L.marker([lat, lon], {
      icon: L.divIcon({
        html: `<div style="background:#2563eb;border-radius:50%;width:16px;height:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
    }).addTo(this.map);

    this.map.flyTo([lat, lon], 16, { duration: 1.2 });
    this.searchResults = [];
    this.searchQuery = result.display_name.split(',')[0];
    this.cdr.detectChanges();
  }

  // Método para limpiar la búsqueda actual.
  // Vacía el texto, elimina resultados y borra el marcador temporal si existe.
  // También actualiza la vista para reflejar el estado limpio.
  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];

    if (this.searchMarker) {
      this.searchMarker.remove();
      this.searchMarker = null;
    }

    this.cdr.detectChanges();
  }

  // Lista de marcadores de eventos pintados actualmente en el mapa.
  private markers: any[] = [];

  // Marcador de evento seleccionado por el usuario.
  private selectedMarker: any = null;

  // Método para construir un icono personalizado de Leaflet.
  // Usa el SVG de la categoría y adapta tamaño y color según esté seleccionado.
  // Devuelve un divIcon con forma de marcador tipo pin.
  buildIcon(L: any, svg: string, size: number, selected = false) {
    const iconSize = Math.round(size * 0.58);
    const bg = selected ? '#2563eb' : 'white';
    const svgFinal = selected
      ? svg.replace(/stroke="#2563eb"/g, 'stroke="white"')
      : svg;

    return L.divIcon({
      html: `<div style="
        width:${size}px;height:${size}px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        background:${bg};
        border:2px solid #2563eb;
      "><span style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center">${svgFinal.replace(/width="20" height="20"/, `width="${iconSize}" height="${iconSize}"`)}</span></div>`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
    });
  }

  // Método para cerrar el panel del evento seleccionado.
  // Restaura el estilo normal del marcador seleccionado.
  // Limpia tanto el marcador activo como el evento mostrado en el panel.
  async closePanel() {
    if (this.selectedMarker) {
      const L = await import('leaflet');
      const idx = this.markers.indexOf(this.selectedMarker);

      if (idx !== -1) {
        const event = this.events[idx];
        const svg = this.categorySvgs[event.category] || this.categorySvgs['default'];
        const size = this.getMarkerSize(this.map.getZoom());
        this.selectedMarker.setIcon(this.buildIcon(L, svg, size, false));
      }

      this.selectedMarker = null;
    }

    this.selectedEvent = null;
    this.cdr.detectChanges();
  }

  // Método para añadir los marcadores de eventos al mapa.
  // Limpia marcadores anteriores, calcula el tamaño según zoom
  // y registra eventos de hover y click para cada marcador.
  async addMarkers() {
    const L = await import('leaflet');

    this.markers.forEach(m => m.remove());
    this.markers = [];

    const zoom = this.map.getZoom();
    const size = this.getMarkerSize(zoom);

    this.events.forEach(event => {
      const svg = this.categorySvgs[event.category] || this.categorySvgs['default'];
      const icon = this.buildIcon(L, svg, size);

      const marker = L.marker([event.latitude, event.longitude], { icon }).addTo(this.map);

      // Al pasar el ratón, se resalta el marcador si no está seleccionado.
      marker.on('mouseover', () => {
        if (marker !== this.selectedMarker) {
          const el = marker.getElement()?.querySelector('div') as HTMLElement;
          if (el) {
            el.style.background = '#eff6ff';
            el.style.border = '3px solid #1d4ed8';
          }
        }
      });

      // Al salir el ratón, se restaura el estilo del marcador no seleccionado.
      marker.on('mouseout', () => {
        if (marker !== this.selectedMarker) {
          const el = marker.getElement()?.querySelector('div') as HTMLElement;
          if (el) {
            el.style.background = 'white';
            el.style.border = '2px solid #2563eb';
          }
        }
      });

      // Al hacer clic, se selecciona o deselecciona el evento asociado al marcador.
      marker.on('click', async () => {
        const Lc = await import('leaflet');
        const s = this.getMarkerSize(this.map.getZoom());

        if (this.selectedMarker === marker) {
          marker.setIcon(this.buildIcon(Lc, svg, s, false));
          this.selectedMarker = null;
          this.selectedEvent = null;
          this.cdr.detectChanges();
          return;
        }

        // Si ya había otro marcador seleccionado, se restaura antes de seleccionar el nuevo.
        if (this.selectedMarker) {
          const prevIdx = this.markers.indexOf(this.selectedMarker);
          if (prevIdx !== -1) {
            const prevEvent = this.events[prevIdx];
            const prevSvg = this.categorySvgs[prevEvent.category] || this.categorySvgs['default'];
            this.selectedMarker.setIcon(this.buildIcon(Lc, prevSvg, s, false));
          }
        }

        marker.setIcon(this.buildIcon(Lc, svg, s, true));
        this.selectedMarker = marker;
        this.selectedEvent = event;
        this.cdr.detectChanges();
      });

      this.markers.push(marker);
    });
  }

  // Método para calcular el tamaño de los marcadores según el nivel de zoom.
  // Cuanto más cerca esté el mapa, mayor será el marcador.
  // Mejora la legibilidad sin saturar el mapa en zooms lejanos.
  getMarkerSize(zoom: number): number {
    if (zoom <= 11) return 24;
    if (zoom <= 13) return 32;
    if (zoom <= 15) return 40;
    return 48;
  }

  // Método para actualizar el tamaño de todos los marcadores al cambiar el zoom.
  // Reconstruye cada icono manteniendo el estado seleccionado si corresponde.
  // Se ejecuta desde el evento zoomend del mapa.
  async updateMarkerSizes() {
    const L = await import('leaflet');
    const zoom = this.map.getZoom();
    const size = this.getMarkerSize(zoom);

    this.markers.forEach((marker, i) => {
      const event = this.events[i];
      const svg = this.categorySvgs[event.category] || this.categorySvgs['default'];
      const isSelected = marker === this.selectedMarker;
      marker.setIcon(this.buildIcon(L, svg, size, isSelected));
    });
  }
}