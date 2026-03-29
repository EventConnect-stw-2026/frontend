import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { HeaderComponent } from '../../layout/components/header/header';
import { StripHtmlPipe } from '../../shared/pipes/strip-html.pipe';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, StripHtmlPipe],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss',
})
export class ExploreComponent implements OnInit {
  events: any[] = [];
  loading = true;
  error = false;
  searchText = '';
  selectedCategory = '';
  dateFrom = '';
  dateTo = '';
  page = 1;
  totalPages = 1;

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

  private eventService = inject(EventService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) this.loadEvents();
  }

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

  selectCategory(cat: string) {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
    this.page = 1;
    this.loadEvents();
  }

  onSearch() { this.page = 1; this.loadEvents(); }
  onDateChange() { this.page = 1; this.loadEvents(); }
  clearDates() { this.dateFrom = ''; this.dateTo = ''; this.page = 1; this.loadEvents(); }
  prevPage() { if (this.page > 1) { this.page--; this.loadEvents(); } }
  nextPage() { if (this.page < this.totalPages) { this.page++; this.loadEvents(); } }
}