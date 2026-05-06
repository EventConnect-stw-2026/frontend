import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private cdr = inject(ChangeDetectorRef);

  isLoggedIn$ = this.authService.isLoggedIn$();
  menuOpen = false;
  hasFriendsNotifications = false;

  ngOnInit(): void {
    this.isLoggedIn$.subscribe((isLoggedIn) => {
      if (!isLoggedIn) {
        this.hasFriendsNotifications = false;
        this.notificationsService.clearNotifications();
        this.cdr.detectChanges();
        return;
      }

      this.notificationsService.hasFriendsNotifications$.subscribe(value => {
        this.hasFriendsNotifications = value;
        this.cdr.detectChanges();
      });

      this.notificationsService.refreshAllFriendsNotifications();
    });
  }
}