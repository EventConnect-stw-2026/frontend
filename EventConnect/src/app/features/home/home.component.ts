/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: home.component.ts
 * Descripción: Componente encargado de gestionar la página principal, incluyendo carrusel,
 * secciones de eventos, recomendaciones personalizadas, resumen con IA y asesor de planes.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

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
import { environment } from '../../../environments/environment';

// Componente principal de la aplicación.
// Carga los eventos de portada, gestiona carruseles,
// recomendaciones personalizadas, resumen con IA y asesor de planes.
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, EventCardComponent, HeaderComponent, HttpClientModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {

  // URL base de la API obtenida desde el fichero de entorno.
  private readonly apiUrl = environment.apiUrl;

  // Lista de eventos recomendados en función del perfil o historial del usuario.
  forYouEvents: any[] = [];

  // Índice actual del carrusel de recomendaciones personalizadas.
  forYouIndex = 0;

  // Indica si se están cargando las recomendaciones personalizadas.
  loadingForYou = false;

  // Controla si debe mostrarse la sección "Basado en tus eventos".
  showPersonalized = false;

  // Número de tarjetas visibles por carrusel.
  readonly VISIBLE = 4;

  // Índices actuales de cada carrusel de secciones generales.
  featuredIndex = 0;
  todayIndex = 0;
  weekIndex = 0;
  recentIndex = 0;

  // Método para obtener el subconjunto visible de un carrusel.
  // Recibe el listado completo y el índice actual.
  // Devuelve únicamente las tarjetas que deben mostrarse en pantalla.
  visibleSlice(arr: any[], index: number) {
    return arr.slice(index, index + this.VISIBLE);
  }

  // Método para comprobar si un carrusel puede avanzar.
  // Compara el índice actual con el número de eventos visibles.
  // Devuelve true si todavía quedan eventos por mostrar.
  canNext(arr: any[], index: number) {
    return index < arr.length - this.VISIBLE;
  }

  // Método para comprobar si un carrusel puede retroceder.
  // Devuelve true cuando el índice actual es mayor que cero.
  canPrev(index: number) {
    return index > 0;
  }

  // Método para avanzar el carrusel de una sección concreta.
  // Comprueba primero si la sección puede avanzar.
  // Actualiza solo el índice correspondiente a la sección recibida.
  next(section: string) {
    if (section === 'featured' && this.canNext(this.sections.featured, this.featuredIndex)) this.featuredIndex++;
    if (section === 'today'    && this.canNext(this.sections.today,    this.todayIndex))    this.todayIndex++;
    if (section === 'week'     && this.canNext(this.sections.week,     this.weekIndex))     this.weekIndex++;
    if (section === 'recent'   && this.canNext(this.sections.recent,   this.recentIndex))   this.recentIndex++;
  }

  // Método para retroceder el carrusel de una sección concreta.
  // Comprueba primero si la sección puede retroceder.
  // Actualiza solo el índice correspondiente a la sección recibida.
  prev(section: string) {
    if (section === 'featured' && this.canPrev(this.featuredIndex)) this.featuredIndex--;
    if (section === 'today'    && this.canPrev(this.todayIndex))    this.todayIndex--;
    if (section === 'week'     && this.canPrev(this.weekIndex))     this.weekIndex--;
    if (section === 'recent'   && this.canPrev(this.recentIndex))   this.recentIndex--;
  }

  // Getter que devuelve las recomendaciones personalizadas visibles actualmente.
  get forYouVisible() {
    return this.forYouEvents.slice(this.forYouIndex, this.forYouIndex + this.VISIBLE);
  }

  // Método para avanzar el carrusel personalizado.
  // Solo avanza si existen más eventos fuera del rango visible.
  forYouNext() {
    if (this.forYouIndex < this.forYouEvents.length - this.VISIBLE) this.forYouIndex++;
  }

  // Método para retroceder el carrusel personalizado.
  // Solo retrocede si no está en el primer elemento.
  forYouPrev() {
    if (this.forYouIndex > 0) this.forYouIndex--;
  }

  // Listado general de eventos usado por filtros y resumen de IA.
  events: any[] = [];

  // Indica si se están cargando las secciones principales de eventos.
  loading = true;

  // Indica si ha ocurrido un error al cargar eventos.
  error = false;

  // Texto del resumen generado por IA.
  aiSummary: string | null = null;

  // Enlaces destacados devueltos junto con el resumen de IA.
  aiHighlights: { text: string; eventId: string }[] = [];

  // Indica si la IA está generando el resumen.
  aiLoading = false;

  // Indica si se ha producido un error en la generación con IA.
  aiError = false;

  // Categorías disponibles para filtrar el resumen inteligente.
  categories = [
    'Deporte', 'Música', 'Teatro y Artes Escénicas', 'Artes plásticas',
    'Cursos y Talleres', 'Formación', 'Ocio y Juegos', 'Turismo',
    'Gastronomía', 'Aire Libre y Excursiones', 'Medio Ambiente y Naturaleza',
    'Conferencias y Congresos', 'Imagen y sonido', 'Idiomas',
    'Desarrollo personal', 'Otros'
  ];

  // Categoría seleccionada para el resumen de IA.
  selectedCategory: string = '';

  // Rango temporal seleccionado para el resumen de IA.
  selectedRange: string = 'week';

  // Secciones de eventos mostradas en la página principal.
  sections: any = {
    featured: [],
    today: [],
    week: [],
    recent: []
  };

  // Método para filtrar eventos según categoría y rango temporal.
  // Se usa como apoyo para obtener eventos relevantes.
  // Devuelve una copia filtrada del listado general.
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

  // Método para solicitar al backend un resumen inteligente de eventos.
  // Envía la categoría y fecha seleccionadas como filtros.
  // Actualiza el resumen, los destacados y el estado de carga.
  generateSummary() {
    this.aiLoading = true;
    this.aiError = false;
    this.aiSummary = null;

    this.http.post<any>(`${this.apiUrl}/ai/summary`, {
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

  // Opciones de acompañante disponibles en el asesor de planes.
  companions = [
    { label: '👤 Solo',       value: 'solo' },
    { label: '❤️ En pareja',  value: 'pareja' },
    { label: '👥 En grupo',   value: 'grupo' },
    { label: '👨‍👩‍👧 Familia',   value: 'familia' },
  ];

  // Opciones de tipo de plan o ambiente buscado por el usuario.
  vibes = [
    { label: '😌 Algo tranquilo',    value: 'tranquilo' },
    { label: '⚡ Algo emocionante',  value: 'emocionante' },
    { label: '🌿 Al aire libre',     value: 'exterior' },
    { label: '🏛️ Bajo techo',        value: 'interior' },
    { label: '🍽️ Con buena comida',  value: 'gastronomico' },
    { label: '🎨 Algo cultural',     value: 'cultural' },
  ];

  // Opción de acompañante seleccionada por el usuario.
  selectedCompanion: any = null;

  // Opción de ambiente seleccionada por el usuario.
  selectedVibe: any = null;

  // Eventos recomendados por el asesor de planes.
  recommendedEvents: any[] = [];

  // Indica si el asesor está buscando recomendaciones.
  advisorLoading = false;

  // Indica si el asesor no ha podido obtener recomendaciones.
  advisorError = false;

  // Identificador de plataforma usado para ejecutar lógica solo en navegador.
  private platformId = inject(PLATFORM_ID);

  // Servicio de autenticación utilizado para obtener perfil y recomendaciones.
  private authService = inject(AuthService);

  // Referencia para forzar la detección de cambios al actualizar datos.
  private cdr = inject(ChangeDetectorRef);

  // Servicio usado para ejecutar el carrusel fuera de Angular y optimizar rendimiento.
  private ngZone = inject(NgZone);

  // Constructor con servicios necesarios para eventos y peticiones HTTP.
  constructor(
    private eventService: EventService,
    private http: HttpClient
  ) {}

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Inicia el carrusel, carga recomendaciones personalizadas
  // y obtiene las secciones principales de eventos desde el backend.
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startCarousel();
      this.loadForYou();

      this.http.get<any>(`${this.apiUrl}/events/sections`)
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

  // Método privado para cargar recomendaciones personalizadas.
  // Observa el usuario actual y muestra la sección solo si tiene eventos o intereses.
  // Si existen recomendaciones, las guarda y activa el carrusel personalizado.
  private loadForYou() {
    this.authService.currentUser$.subscribe((profile: any) => {
      const hasAttended  = (profile?.attendedEvents ?? []).length > 0;
      const hasInterests = (profile?.interests ?? []).length > 0;

      if (!profile || (!hasAttended && !hasInterests)) {
        this.showPersonalized = false;
        this.cdr.detectChanges();
        return;
      }

      this.loadingForYou = true;
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
            this.forYouEvents = events;
            this.forYouIndex = 0;
            this.showPersonalized = true;
          }

          this.cdr.detectChanges();
        });
    });
  }

  // Método del ciclo de vida ejecutado al destruir el componente.
  // Detiene el carrusel automático para evitar intervalos activos.
  ngOnDestroy() {
    this.stopCarousel();
  }

  // Método para seleccionar con quién irá el usuario al plan.
  // Reinicia la segunda selección y los resultados anteriores.
  // Forma parte del flujo del asesor de planes.
  selectCompanion(option: any) {
    this.selectedCompanion = option;
    this.selectedVibe = null;
    this.recommendedEvents = [];
    this.advisorError = false;
  }

  // Método para seleccionar el tipo de plan buscado.
  // Guarda la opción seleccionada y solicita recomendaciones al backend.
  selectVibe(option: any) {
    this.selectedVibe = option;
    this.fetchRecommendation(this.selectedCompanion.value, option.value);
  }

  // Método para obtener recomendaciones del asesor de planes.
  // Envía al backend el acompañante y el ambiente seleccionados.
  // Actualiza los eventos recomendados o muestra error si falla.
  fetchRecommendation(companion: string, vibe: string) {
    this.advisorLoading = true;
    this.recommendedEvents = [];
    this.advisorError = false;

    this.http.post<any>(`${this.apiUrl}/recommend`, { companion, vibe })
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

  // Método para reiniciar el asesor de planes.
  // Limpia las selecciones, resultados y errores.
  // Permite volver a empezar el proceso de recomendación.
  resetAdvisor() {
    this.selectedCompanion = null;
    this.selectedVibe = null;
    this.recommendedEvents = [];
    this.advisorError = false;
  }

  // Imágenes utilizadas en el carrusel principal de la portada.
  slides = [
    { img: 'assets/images/Zaragoza.jpg',  position: 'center 20%' },
    { img: 'assets/images/Zaragoza2.jpg', position: 'center 20%' },
    { img: 'assets/images/Zaragoza3.webp', position: 'center bottom' },
  ];

  // Índice de la diapositiva actualmente visible en el carrusel.
  currentSlide = 0;

  // Suscripción usada para controlar el intervalo del carrusel automático.
  private carouselSub: Subscription | null = null;

  // Método para iniciar el carrusel automático.
  // Ejecuta el intervalo fuera de Angular para optimizar rendimiento.
  // Cada cambio vuelve a entrar en Angular para actualizar la vista.
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

  // Método para detener el carrusel automático.
  // Cancela el intervalo activo y limpia la referencia guardada.
  stopCarousel() {
    this.carouselSub?.unsubscribe();
    this.carouselSub = null;
  }

  // Método para avanzar manualmente a la siguiente diapositiva.
  // Reinicia el intervalo automático después del cambio manual.
  nextSlide() {
    this.stopCarousel();
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.startCarousel();
  }

  // Método para retroceder manualmente a la diapositiva anterior.
  // Usa módulo para volver al final si se está en la primera diapositiva.
  prevSlide() {
    this.stopCarousel();
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.startCarousel();
  }

  // Método para saltar directamente a una diapositiva concreta.
  // Se utiliza desde los indicadores inferiores del carrusel.
  goToSlide(index: number) {
    this.stopCarousel();
    this.currentSlide = index;
    this.startCarousel();
  }

  // Método para desplazar la página hasta la primera sección de contenido.
  // Usa scroll suave para mejorar la experiencia de navegación.
  scrollToContent() {
    document.querySelector('.for-you-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}