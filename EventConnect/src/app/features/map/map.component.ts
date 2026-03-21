import { Component, OnInit, inject, PLATFORM_ID, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { HeaderComponent } from '../../layout/components/header/header';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, DatePipe],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit {
  events: any[] = [];
  selectedEvent: any = null;
  private platformId = inject(PLATFORM_ID);
  private eventService = inject(EventService);
  private cdr = inject(ChangeDetectorRef);
  private map: any;

  categoryEmojis: Record<string, string> = {
    'Deporte': '⚽',
    'Deportivo': '⚽',
    'Música': '🎵',
    'Cultural': '🎭',
    'Cultura': '🎭',
    'Social': '👥',
    'Educativo': '📚',
    'Gastronómico': '🍽️',
    'Empresarial': '💼',
    'Religioso': '⛪',
    'default': '📍'
  };

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

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');

      this.map = L.map('map', { center: [41.6488, -0.8891], zoom: 13 });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(this.map);

      // Redibuja marcadores al cambiar zoom
      this.map.on('zoomend', () => {
        this.updateMarkerSizes();
      });

      if (this.events.length) this.addMarkers();
    }
  }

  private markers: any[] = [];

  async addMarkers() {
    const L = await import('leaflet');
    this.markers.forEach(m => m.remove());
    this.markers = [];

    const zoom = this.map.getZoom();
    const size = this.getMarkerSize(zoom);

    this.events.forEach(event => {
      const emoji = this.categoryEmojis[event.category] || this.categoryEmojis['default'];
      const icon = this.buildIcon(L, emoji, size);

      const marker = L.marker([event.latitude, event.longitude], { icon }).addTo(this.map);
      marker.on('click', () => { this.selectedEvent = event; this.cdr.detectChanges(); });
      this.markers.push(marker);
    });
  }

  getMarkerSize(zoom: number): number {
    if (zoom <= 11) return 24;
    if (zoom <= 13) return 32;
    if (zoom <= 15) return 40;
    return 48;
  }

  buildIcon(L: any, emoji: string, size: number) {
    return L.divIcon({
      html: `<div style="
        width:${size}px;height:${size}px;
        background:white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(0,0,0,0.25);
        border:2px solid #2563eb;
        font-size:${size * 0.45}px;
      "><span style="transform:rotate(45deg);display:block">${emoji}</span></div>`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
    });
  }

  async updateMarkerSizes() {
    const L = await import('leaflet');
    const zoom = this.map.getZoom();
    const size = this.getMarkerSize(zoom);

    this.markers.forEach((marker, i) => {
      const event = this.events[i];
      const emoji = this.categoryEmojis[event.category] || this.categoryEmojis['default'];
      marker.setIcon(this.buildIcon(L, emoji, size));
    });
  }

  getEmoji(category: string): string {
    return this.categoryEmojis[category] || this.categoryEmojis['default'];
  }
}