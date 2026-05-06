import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReportService } from '../../../core/services/report.service';
import { HeaderComponent } from '../../../layout/components/header/header';
interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  interests?: string[];
}

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss'
})
export class ProfileViewComponent {
  private authService = inject(AuthService);
  private sanitizer   = inject(DomSanitizer);
  private router = inject(Router);
  private reportService = inject(ReportService);

  // Report UI
  reportVisible = false;
  reportReason = 'other';
  reportDescription = '';

  openReportUser() {
    if (!this.user || !this.user._id) return;
    this.reportVisible = true;
    this.reportReason = 'other';
    this.reportDescription = '';
  }

  submitUserReport() {
    if (!this.user || !this.user._id) return;
    const payload = {
      type: 'user',
      involvedUserId: this.user._id,
      reason: this.reportReason,
      description: this.reportDescription
    };
    this.reportService.createReport(payload).subscribe({
      next: () => {
        this.reportVisible = false;
        // feedback minimal
        alert('Reporte enviado. Gracias.');
      },
      error: () => alert('Error enviando reporte')
    });
  }

  user: UserProfile = {
    name: 'Jeffrey Preston Bezos',
    email: 'jeff@amazon.com',
    username: 'jeffAmazon',
    avatarUrl:
      'https://upload.wikimedia.org/wikipedia/commons/9/91/Jeff_Bezos_2016.jpg',
    interests: ['culture', 'sports', 'family']
  };

  getSvg(key: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.interestSvgs[key] ?? '');
  }

    readonly interestSvgs: Record<string, string> = {
    culture: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><circle cx="9" cy="10" r="6"/><path d="M12.5 10a3.5 3.5 0 0 1-7 0"/><circle cx="17" cy="10" r="4"/><path d="M19.5 10a2.5 2.5 0 0 1-5 0"/><path d="M15 16.5c1 1 2.5 1.5 4 1"/><path d="M9 17c1.5 1.5 4 2 6 1.5"/></svg>`,
    sports: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`,
    family: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    solidarity: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M18 11V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1"/><path d="M14 10V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 9.9V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/><path d="M6 14v0a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-3a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2"/></svg>`,
    education: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    gastronomy: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7"/></svg>`,
    wellness: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  };

  readonly interestLabels: Record<string, string> = {
    culture:    'Cultura',
    sports:     'Deporte',
    family:     'Familia',
    solidarity: 'Solidario',
    education:  'Educación',
    gastronomy: 'Gastronomía',
    wellness:   'Bienestar',
  };

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (profile: UserProfile) => {
        this.user = {
          _id: profile._id ?? '',
          name: profile.name ?? 'Usuario',
          email: profile.email ?? '',
          username: profile.username ?? '',
          avatarUrl: profile.avatarUrl ?? 'assets/images/default-avatar.svg',
          bio: profile.bio ?? '',
          location: profile.location ?? '',
          interests: profile.interests ?? ['culture', 'sports', 'family']
        };
      },
      error: () => {
        // Si hay error, deja los datos de ejemplo
      }
    });
  }

  goToEditProfile(): void {
    this.router.navigate(['/profile/edit']);
  }

  goToFavorites(): void {
    this.router.navigate(['/favorites']);
  }

  goToHistory(): void {
    this.router.navigate(['/history']);
  }

  goToStats(): void {
    this.router.navigate(['/stats']);
  }

  logout(): void {
    this.user = {
      name: '',
      email: '',
      username: '',
      avatarUrl: '',
      bio: '',
      location: '',
      interests: []
    };
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}