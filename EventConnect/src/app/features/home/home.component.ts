import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { EventCardComponent } from '../../shared/components/event-card/event-card';
import { EventService } from '../../core/services/event.service';
import { HeaderComponent } from '../../layout/components/header/header';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, EventCardComponent, HeaderComponent, HttpClientModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  // ── Basado en tus eventos ──────────────────────────────────────────────
  forYouEvents: any[]  = [];
  forYouIndex          = 0;
  loadingForYou        = false;
  showPersonalized     = false;
  readonly VISIBLE     = 4;

  get forYouVisible() { return this.forYouEvents.slice(this.forYouIndex, this.forYouIndex + this.VISIBLE); }
  forYouNext() { if (this.forYouIndex < this.forYouEvents.length - this.VISIBLE) this.forYouIndex++; }
  forYouPrev() { if (this.forYouIndex > 0) this.forYouIndex--; }

  events: any[] = [];
  loading = true;
  error = false;
  aiSummary: string | null = null;
  aiHighlights: { text: string; eventId: string }[] = [];
  aiLoading = false;
  aiError = false;
  categories = [
    'Deporte', 'Música', 'Teatro y Artes Escénicas', 'Artes plásticas',
    'Cursos y Talleres', 'Formación', 'Ocio y Juegos', 'Turismo',
    'Gastronomía', 'Aire Libre y Excursiones', 'Medio Ambiente y Naturaleza',
    'Conferencias y Congresos', 'Imagen y sonido', 'Idiomas',
    'Desarrollo personal', 'Otros'
  ];
  selectedCategory: string = '';  // vacío = todas
  selectedRange: string = 'week';
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

    this.http.post<any>('http://localhost:3000/api/ai/summary', {
      category: this.selectedCategory !== 'all' ? this.selectedCategory : null,
      date: this.selectedRange === 'today' ? new Date().toISOString() : null
    }).subscribe({
      next: (res: any) => {
        console.log("RES COMPLETO:", JSON.stringify(res));
        console.log("RES.SUMMARY:", res.summary);
        console.log("TIPO:", typeof res.summary);
        this.aiSummary = res.summary || '';
        this.aiHighlights = res.highlights || [];
        this.aiLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log("RES COMPLETO:", JSON.stringify(err));
        console.log("RES.SUMMARY:", err.summary);
        console.log("TIPO:", typeof err.summary);
        this.aiSummary = 'No se pudo generar el resumen.';
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

  private platformId   = inject(PLATFORM_ID);
  private authService  = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  constructor(
    private eventService: EventService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {  
      this.startCarousel();
      this.loadForYou();

      this.http.get<any>('http://localhost:3000/api/events/sections')
        .subscribe({
          next: (res: any) => {
            console.log("SECTIONS:", res);
            this.sections = res.data;
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

  private loadForYou() {
    this.authService.currentUser$.subscribe((profile: any) => {
      if (!profile || (profile.attendedEvents ?? []).length === 0) {
        this.showPersonalized = false;
        this.cdr.detectChanges();
        return;
      }

      this.loadingForYou   = true;
      this.showPersonalized = true;
      this.cdr.detectChanges();

      this.authService.getRecommendations(10)
        .pipe(catchError(() => of({ data: [] })))
        .subscribe((res: any) => {
          const events = res.data ?? [];
          this.loadingForYou = false;
          if (events.length === 0) {
            this.showPersonalized = false;
          } else {
            this.forYouEvents     = events;
            this.forYouIndex      = 0;
            this.showPersonalized = true;
          }
          this.cdr.detectChanges();
        });
    });
  }

  ngOnDestroy() {
    this.stopCarousel();
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

  // Carousel
  slides = [
    { img: 'assets/images/Zaragoza.jpg',  position: 'center 20%' },
    { img: 'assets/images/Zaragoza2.jpg', position: 'center 20%' },
    { img: 'assets/images/Zaragoza3.webp', position: 'center bottom' },
  ];
  currentSlide = 0;
  private carouselSub: Subscription | null = null;

  startCarousel() {
    this.stopCarousel();
    this.ngZone.runOutsideAngular(() => {
      const id = setInterval(() => {
        this.ngZone.run(() => {
          this.currentSlide = (this.currentSlide + 1) % this.slides.length;
          this.cdr.markForCheck();
        });
      }, 7000);
      this.carouselSub = { unsubscribe: () => clearInterval(id) } as any;
    });
  }

  stopCarousel() {
    this.carouselSub?.unsubscribe();
    this.carouselSub = null;
  }

  nextSlide() {
    this.stopCarousel();
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.startCarousel();
  }

  prevSlide() {
    this.stopCarousel();
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.startCarousel();
  }

  goToSlide(index: number) {
    this.stopCarousel();
    this.currentSlide = index;
    this.startCarousel();
  }

  scrollToContent() {
    document.querySelector('.featured')?.scrollIntoView({ behavior: 'smooth' });
  }
}