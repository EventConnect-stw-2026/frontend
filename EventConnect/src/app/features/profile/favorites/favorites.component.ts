import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EventService } from '../../../core/services/event.service';
import { HeaderComponent } from '../../../layout/components/header/header';
import { Subscription } from 'rxjs';

const PAGE_SIZE = 6;

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent implements OnInit, OnDestroy {
  private authService  = inject(AuthService);
  private eventService = inject(EventService);
  private router       = inject(Router);
  private cdr          = inject(ChangeDetectorRef);

  events: any[] = [];
  loading       = true;
  loadError     = false;
  page          = 1;

  private attendingSub: Subscription | null = null;

  get paginatedEvents() {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.events.slice(start, start + PAGE_SIZE);
  }

  get totalPages() {
    return Math.ceil(this.events.length / PAGE_SIZE);
  }

  ngOnInit() {
    console.log('[FavoritesComponent] ngOnInit() #' + Math.random().toString(36).substring(7) + ' - calling getAttending()');
    console.log('[FavoritesComponent] loading state before:', this.loading);
    this.loading = true;
    this.loadError = false;
    this.cdr.markForCheck();
    console.log('[FavoritesComponent] loading state after setting to true:', this.loading);
    
    // Unsubscribe from any previous subscription
    if (this.attendingSub) {
      console.log('[FavoritesComponent] Unsubscribing from previous attendingSub');
      this.attendingSub.unsubscribe();
    }
    
    this.attendingSub = this.authService.getAttending().subscribe({
      next: (res) => {
        console.log('[FavoritesComponent] getAttending() success:', res);
        console.log('[FavoritesComponent] setting loading=false');
        this.events  = res.data ?? [];
        this.loading = false;
        this.loadError = false;
        console.log('[FavoritesComponent] events updated, loading=false, events.length=', this.events.length);
        this.cdr.markForCheck();
        console.log('[FavoritesComponent] markForCheck called');
      },
      error: (err: any) => {
        console.error('[FavoritesComponent] getAttending() error:', err);
        this.loading = false;
        this.loadError = true;
        this.cdr.markForCheck();
        
        if (err.status === 401) {
          console.log('[FavoritesComponent] 401 error, navigating to login');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  ngOnDestroy() {
    console.log('[FavoritesComponent] ngOnDestroy - unsubscribing');
    if (this.attendingSub) {
      this.attendingSub.unsubscribe();
    }
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