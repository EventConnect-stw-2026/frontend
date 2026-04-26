import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from '../../layout/components/header/header';
import { EventService } from '../../core/services/event.service';

// ─── TIPOS ─────────────────────────────────────────────

type CategoryStat = {
  label: string;
  value: number;
  color: string;
};

type DayStat = {
  day: string;
  count: number;
};

type PersonalStats = {
  eventsAttended: number;
  friendsMet: number;
  topCategory: string | null;
  busiestDay: string | null;
  categoryStats: CategoryStat[];
  dayStats: DayStat[];
};

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

  // ─── GLOBAL STATS ─────────────────────────────────────

  categoryStats: CategoryStat[] = [];
  dayStats: DayStat[] = [];

  // ─── PERSONAL STATS (TIPADO CORRECTO) ─────────────────

  personalStats: PersonalStats = {
    friendsMet: 0,
    eventsAttended: 0,
    topCategory: null,
    busiestDay: null,
    categoryStats: [],
    dayStats: [],
  };

  // ─── COMPUTED ─────────────────────────────────────────

  get sortedCategoryStats() {
    const white = ['white', '#fff', '#ffffff'];
    return [...this.categoryStats]
      .filter(c => !white.includes(c.color?.toLowerCase()))
      .sort((a, b) => b.value - a.value);
  }

  get maxCategory() {
    return this.categoryStats.length
      ? Math.max(...this.categoryStats.map(c => c.value))
      : 1;
  }

  get maxDay() {
    return this.dayStats.length
      ? Math.max(...this.dayStats.map(d => d.count))
      : 1;
  }

  get maxPersonalCategory() {
    return this.personalStats.categoryStats.length
      ? Math.max(...this.personalStats.categoryStats.map(c => c.value))
      : 1;
  }

  get maxPersonalDay() {
    return this.personalStats.dayStats.length
      ? Math.max(...this.personalStats.dayStats.map(d => d.count))
      : 1;
  }

  // ─── INIT ─────────────────────────────────────────────

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGlobalStats();
      this.loadPersonalStats();
    }
  }

  // ─── LOAD GLOBAL ──────────────────────────────────────

  loadGlobalStats() {
    this.eventService.getGlobalStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.categoryStats = res.data.categoryStats ?? [];
          this.dayStats = res.data.dayStats ?? [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error cargando stats globales', err)
    });
  }

  // ─── LOAD PERSONAL (CLAVE) ────────────────────────────

  loadPersonalStats() {
    this.eventService.getPersonalStats().subscribe({
      next: (res) => {
        if (res.success) {

          // ❗ NO reasignar directamente
          this.personalStats = {
            friendsMet: res.data.friendsMet ?? 0,
            eventsAttended: res.data.eventsAttended ?? 0,
            topCategory: res.data.topCategory ?? null,
            busiestDay: res.data.busiestDay ?? null,
            categoryStats: res.data.categoryStats ?? [],
            dayStats: res.data.dayStats ?? []
          };

          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error cargando stats personales', err);

        // fallback válido con tipos correctos
        this.personalStats.topCategory = 'Inicia sesión para ver';
        this.personalStats.busiestDay = 'Inicia sesión para ver';

        this.cdr.detectChanges();
      }
    });
  }

  // ─── UI ───────────────────────────────────────────────

  setTab(tab: 'personal' | 'global') {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }
}