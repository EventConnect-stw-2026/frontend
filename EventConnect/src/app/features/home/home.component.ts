import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { EventCardComponent } from '../../shared/components/event-card/event-card';
import { EventService } from '../../core/services/event.service';
import { HeaderComponent } from '../../layout/components/header/header';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, EventCardComponent, HeaderComponent, HttpClientModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  events: any[] = [];
  loading = true;
  error = false;
  aiSummary: string | null = null;
  aiLoading = false;
  aiError = false;
  selectedCategory: string = 'all';
  selectedRange: string = 'today';
  sections: any = {
    featured: [],
    today: [],
    week: [],
    recent: []
  };

  getFilteredEvents() {
    let filtered = [...this.events];

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === this.selectedCategory);
    }

    if (this.selectedRange === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(e =>
        new Date(e.startDate).toDateString() === today
      );
    }

    if (this.selectedRange === 'week') {
      const now = new Date();
      const weekLater = new Date();
      weekLater.setDate(now.getDate() + 7);

      filtered = filtered.filter(e => {
        const d = new Date(e.startDate);
        return d >= now && d <= weekLater;
      });
    }

    return filtered;
  }

 generateSummary() {
  this.aiLoading = true;
  this.aiError = false;
  this.aiSummary = null;

  const filtered = this.getFilteredEvents();

    this.http.post<any>('http://localhost:3000/api/ai/summary', {
      events: filtered
    }).subscribe({
      next: (res: any) => {
        this.aiSummary = res.summary || 'Sin resumen';
        this.aiLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.aiError = true;
        this.aiLoading = false;
        this.cdr.detectChanges();
      }
    });
  }


  // Chatbot
  companions = [
    { label: '👤 Solo',       value: 'solo' },
    { label: '❤️ En pareja',  value: 'pareja' },
    { label: '👥 En grupo',   value: 'grupo' },
    { label: '👨‍👩‍👧 Familia',   value: 'familia' },
  ];

  vibes = [
    { label: '😌 Algo tranquilo',    value: 'tranquilo' },
    { label: '⚡ Algo emocionante',  value: 'emocionante' },
    { label: '🌿 Al aire libre',     value: 'exterior' },
    { label: '🏛️ Bajo techo',        value: 'interior' },
    { label: '🍽️ Con buena comida',  value: 'gastronomico' },
    { label: '🎨 Algo cultural',     value: 'cultural' },
  ];

  selectedCompanion: any = null;
  selectedVibe: any = null;
  recommendedEvents: any[] = [];
  advisorLoading = false;
  advisorError = false;

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private eventService: EventService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.http.get<any>('http://localhost:3000/api/events/sections')
        .subscribe({
          next: (res) => {
            this.sections = res.data;
    console.log("SECTIONS:", res);

            // 👇 IMPORTANTE: mantener compatibilidad con AI
            this.events = [
              ...res.data.featured,
              ...res.data.today,
              ...res.data.week
            ];

            this.loading = false;
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

  selectCompanion(option: any) {
    this.selectedCompanion = option;
    this.selectedVibe = null;
    this.recommendedEvents = [];
    this.advisorError = false;
  }

  selectVibe(option: any) {
    this.selectedVibe = option;
    this.fetchRecommendation(this.selectedCompanion.value, option.value);
  }

  fetchRecommendation(companion: string, vibe: string) {
    this.advisorLoading = true;
    this.recommendedEvents = [];
    this.advisorError = false;

    this.http.post<any>('http://localhost:3000/api/recommend', { companion, vibe })
      .subscribe({
        next: (res) => {
          setTimeout(() => {
            this.recommendedEvents = res.events || [];
            this.advisorLoading = false;
            this.cdr.detectChanges();
          }, 0);
        },
        error: () => {
          this.advisorError = true;
          this.advisorLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  resetAdvisor() {
    this.selectedCompanion = null;
    this.selectedVibe = null;
    this.recommendedEvents = [];
    this.advisorError = false;
  }
}