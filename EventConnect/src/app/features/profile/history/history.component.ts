import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../layout/components/header/header';
import { Subscription } from 'rxjs';

const PAGE_SIZE     = 6;    // Eventos por página en la vista

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent],
  providers: [],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit, OnDestroy {
  private authService  = inject(AuthService);
  private router       = inject(Router);
  private cdr          = inject(ChangeDetectorRef);

  events: any[]   = [];
  loading         = true;
  loadError       = false;
  page            = 1;

  private historySub: Subscription | null = null;

  get paginatedEvents() {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.events.slice(start, start + PAGE_SIZE);
  }

  get totalPages() {
    return Math.ceil(this.events.length / PAGE_SIZE);
  }

  ngOnInit() {
    console.log('[HistoryComponent] ngOnInit() #' + Math.random().toString(36).substring(7) + ' - calling getHistory()');
    console.log('[HistoryComponent] loading state before:', this.loading);
    this.loading = true;
    this.loadError = false;
    this.cdr.markForCheck();
    console.log('[HistoryComponent] loading state after setting to true:', this.loading);
    
    // Unsubscribe from any previous subscription
    if (this.historySub) {
      console.log('[HistoryComponent] Unsubscribing from previous historySub');
      this.historySub.unsubscribe();
    }
    
    // Usamos el endpoint dedicado que devuelve los eventos populados directamente
    this.historySub = this.authService.getHistory().subscribe({
      next: (res) => {
        console.log('[HistoryComponent] getHistory() success:', res);
        console.log('[HistoryComponent] setting loading=false');
        const now = new Date();
        // Historial = solo eventos cuya fecha ya pasó
        this.events = (res.data ?? []).filter(
          (e: any) => e.startDate && new Date(e.startDate) < now
        );
        this.loading = false;
        this.loadError = false;
        console.log('[HistoryComponent] events updated, loading=false, events.length=', this.events.length);
        this.cdr.markForCheck();
        console.log('[HistoryComponent] markForCheck called');
      },
      error: (err: any) => {
        console.error('[HistoryComponent] getHistory() error:', err);
        this.loading = false;
        this.loadError = true;
        this.cdr.markForCheck();
        
        if (err.status === 401) {
          console.log('[HistoryComponent] 401 error, navigating to login');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  ngOnDestroy() {
    console.log('[HistoryComponent] ngOnDestroy - unsubscribing');
    if (this.historySub) {
      this.historySub.unsubscribe();
    }
  }

  onImageError(e: any) {
    e.target.src = 'assets/images/placeholder.svg';
  }

  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }

  goBack()      { this.router.navigate(['/profile']); }
  goToExplore() { this.router.navigate(['/explore']); }
}