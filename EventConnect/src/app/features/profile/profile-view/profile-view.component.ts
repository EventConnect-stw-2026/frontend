import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
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
  imports: [CommonModule, HeaderComponent],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss'
})
export class ProfileViewComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user: UserProfile = {
    name: 'Jeffrey Preston Bezos',
    email: 'jeff@amazon.com',
    username: 'jeffAmazon',
    avatarUrl:
      'https://upload.wikimedia.org/wikipedia/commons/9/91/Jeff_Bezos_2016.jpg',
    interests: ['culture', 'sports', 'family']
  };

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (profile: UserProfile) => {
        this.user = {
          _id: profile._id ?? '',
          name: profile.name ?? 'Usuario',
          email: profile.email ?? '',
          username: profile.username ?? '',
          avatarUrl: profile.avatarUrl ?? 'assets/images/default-avatar.png',
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