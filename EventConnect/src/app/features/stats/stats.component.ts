import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from '../../layout/components/header/header';
import { EventService } from '../../core/services/event.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent implements OnInit {
  activeTab: 'personal' | 'global' = 'global';
  private platformId = inject(PLATFORM_ID);
  private eventService = inject(EventService);
  private cdr = inject(ChangeDetectorRef);

  // Inicializamos las globales vacías
  categoryStats: any[] = [];
  dayStats: any[] = [];

  // Inicializamos las personales a cero
  personalStats = {
    friendsMet: 0,
    topCategory: 'Cargando...',
    busiestDay: 'Cargando...',
    eventsAttended: 0,
  };

  get maxCategory() { 
    return this.categoryStats.length ? Math.max(...this.categoryStats.map(c => c.value)) : 1; 
  }
  get maxDay() { 
    return this.dayStats.length ? Math.max(...this.dayStats.map(d => d.count)) : 1; 
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGlobalStats();
      this.loadPersonalStats();
    }
  }

  loadGlobalStats() {
    this.eventService.getGlobalStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.categoryStats = res.data.categoryStats;
          this.dayStats = res.data.dayStats;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error cargando stats globales', err)
    });
  }

  loadPersonalStats() {
    this.eventService.getPersonalStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.personalStats = res.data;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error cargando stats personales', err);
        this.personalStats.topCategory = 'Inicia sesión para ver';
        this.personalStats.busiestDay = 'Inicia sesión para ver';
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: 'personal' | 'global') {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }
}