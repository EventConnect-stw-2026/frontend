import { Component, OnInit, inject, PLATFORM_ID, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
export class StatsComponent implements OnInit, AfterViewInit {
  activeTab: 'personal' | 'global' = 'global';
  private platformId = inject(PLATFORM_ID);
  private eventService = inject(EventService);
  private cdr = inject(ChangeDetectorRef);

  // Stats globales (mock de momento)
  categoryStats = [
    { label: 'Deporte', value: 342, color: '#2563eb' },
    { label: 'Música', value: 231, color: '#16a34a' },
    { label: 'Cultural', value: 198, color: '#f59e0b' },
    { label: 'Social', value: 175, color: '#8b5cf6' },
    { label: 'Educativo', value: 120, color: '#ec4899' },
  ];

  dayStats = [
    { day: 'Lun', count: 45 },
    { day: 'Mar', count: 72 },
    { day: 'Mié', count: 160 },
    { day: 'Jue', count: 198 },
    { day: 'Vie', count: 290 },
    { day: 'Sáb', count: 310 },
    { day: 'Dom', count: 185 },
  ];

  // Stats personales (mock de momento)
  personalStats = {
    friendsMet: 0,
    topCategory: 'Sin datos',
    busiestDay: 'Sin datos',
    eventsAttended: 0,
  };

  get maxCategory() { return Math.max(...this.categoryStats.map(c => c.value)); }
  get maxDay() { return Math.max(...this.dayStats.map(d => d.count)); }

  ngOnInit() {}
  ngAfterViewInit() {}

  setTab(tab: 'personal' | 'global') {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }
}