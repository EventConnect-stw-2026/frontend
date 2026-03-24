import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss'
})
export class AdminTopbarComponent {
  @Input() title = '';

  showMenu = false;
  private authService = inject(AuthService);
  private router = inject(Router);

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  closeMenu() {
    this.showMenu = false;
  }
}