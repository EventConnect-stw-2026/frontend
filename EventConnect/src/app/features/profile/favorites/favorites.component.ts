import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EventService } from '../../../core/services/event.service';
import { HeaderComponent } from '../../../layout/components/header/header';

const PAGE_SIZE = 6;

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit {
  private authService  = inject(AuthService);
  private eventService = inject(EventService);
  private router       = inject(Router);
  private cdr          = inject(ChangeDetectorRef);

  events: any[] = [];
  loading       = true;
  page          = 1;

  get paginatedEvents() {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.events.slice(start, start + PAGE_SIZE);
  }

  get totalPages() {
    return Math.ceil(this.events.length / PAGE_SIZE);
  }

  ngOnInit() {
    this.authService.getAttending().subscribe({
      next: (res) => {
        this.events  = res.data ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  unattend(domEvent: Event, eventId: string) {
    domEvent.preventDefault();
    domEvent.stopPropagation();
    domEvent.stopImmediatePropagation();

    this.eventService.toggleAttend(eventId).subscribe({
      next: (res: any) => {
        console.log('toggleAttend response:', res);
        if (res.isAttending === false) {
          this.events = this.events.filter((e: any) => e._id !== eventId);
          if (this.paginatedEvents.length === 0 && this.page > 1) this.page--;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.error('Error cancelando asistencia:', err);
      }
    });
  }

  onImageError(e: any) {
    e.target.src = 'assets/images/placeholder.svg';
  }

  goToEvent(id: string) { this.router.navigate(['/events', id]); }
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }
  goBack()      { this.router.navigate(['/profile']); }
  goToExplore() { this.router.navigate(['/explore']); }
}