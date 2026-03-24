import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { HeaderComponent } from '../../layout/components/header/header';
import { StripHtmlPipe } from '../../shared/pipes/strip-html.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, StripHtmlPipe, FormsModule],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
})
export class EventDetailComponent implements OnInit, AfterViewInit {

  event: any = null;
  loading = true;
  error = false;
  activeTab: 'chat' | 'amigos' = 'chat';

  private mapInitialized = false;

  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const id = this.route.snapshot.paramMap.get('id');

      if (id) {
        this.eventService.getEventById(id).subscribe({
          next: (res) => {
            this.event = res.data;
            this.loading = false;

            console.log('EVENT:', this.event);
            console.log('LAT:', this.event?.latitude, 'LNG:', this.event?.longitude);

            this.cdr.detectChanges();
          },
          error: () => {
            this.error = true;
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    }
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const check = setInterval(async () => {
      if (
        this.event &&
        this.event.latitude != null &&
        this.event.longitude != null &&
        !this.mapInitialized
      ) {
        console.log('INIT MAP');

        await this.initMiniMap();
        this.mapInitialized = true;

        clearInterval(check);
      }
    }, 100);
  }

  getEmoji(category: string): string {
    const map: any = {
      'Deporte': '⚽',
      'Deportivo': '⚽',
      'Música': '🎵',
      'Cultural': '🎭',
      'Cultura': '🎭',
      'Social': '👥',
      'Educativo': '📚',
      'Gastronómico': '🍽️',
      'Empresarial': '💼',
      'Religioso': '⛪'
    };

    return map[category] || '📍';
  }

  async initMiniMap() {
    const L = await import('leaflet');

    const mapContainer = document.getElementById('mini-map');

    if (!mapContainer) {
      console.error('❌ No existe el contenedor mini-map');
      return;
    }

    const map = L.map(mapContainer, {
      center: [this.event.latitude, this.event.longitude],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const emoji = this.getEmoji(this.event.category);

    const icon = L.divIcon({
      html: `<div style="
        width:40px;height:40px;
        background:white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(0,0,0,0.25);
        border:2px solid #2563eb;
        font-size:18px;
      "><span style="transform:rotate(45deg)">${emoji}</span></div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    L.marker([this.event.latitude, this.event.longitude], { icon }).addTo(map);

    // 🔥 CRÍTICO: fuerza render correcto
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }
}