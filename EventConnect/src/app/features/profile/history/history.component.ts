import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../layout/components/header/header';

const PAGE_SIZE     = 6;    // Eventos por página en la vista

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent],
  providers: [],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit {
  private authService  = inject(AuthService);
  private router       = inject(Router);

  events: any[]   = [];
  loading         = true;
  page            = 1;

  get paginatedEvents() {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.events.slice(start, start + PAGE_SIZE);
  }

  get totalPages() {
    return Math.ceil(this.events.length / PAGE_SIZE);
  }

  ngOnInit() {
    // Usamos el endpoint dedicado que devuelve los eventos populados directamente
    this.authService.getHistory().subscribe({
      next: (res) => {
        const now = new Date();
        // Historial = solo eventos cuya fecha ya pasó
        this.events = (res.data ?? []).filter(
          (e: any) => e.startDate && new Date(e.startDate) < now
        );
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onImageError(e: any) {
    e.target.src = 'assets/images/placeholder.svg';
  }

  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }

  goBack()      { this.router.navigate(['/profile']); }
  goToExplore() { this.router.navigate(['/explore']); }
}