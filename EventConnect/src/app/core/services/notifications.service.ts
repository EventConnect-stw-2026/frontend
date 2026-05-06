import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { FriendsService } from './friends.service';
import { ChatService } from './chat.service';
import { MeetupService } from './meetup.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private friendsService = inject(FriendsService);
  private chatService = inject(ChatService);
  private meetupService = inject(MeetupService);
  private authService = inject(AuthService);

  private hasFriendsNotificationsSubject = new BehaviorSubject<boolean>(false);
  hasFriendsNotifications$ = this.hasFriendsNotificationsSubject.asObservable();

  private meetupInvitationsSubject = new BehaviorSubject<{
    hasPending: boolean;
    count: number;
  }>({
    hasPending: false,
    count: 0
  });
  meetupInvitations$ = this.meetupInvitationsSubject.asObservable();

  setHasFriendsNotifications(value: boolean): void {
    this.hasFriendsNotificationsSubject.next(value);
  }

  setMeetupInvitations(data: { hasPending: boolean; count: number }): void {
    this.meetupInvitationsSubject.next(data);
  }

  clearNotifications(): void {
    this.setHasFriendsNotifications(false);
    this.setMeetupInvitations({ hasPending: false, count: 0 });
  }

  refreshAllFriendsNotifications(): void {
    if (!this.authService.getCurrentUser()) {
      this.clearNotifications();
      return;
    }

    forkJoin({
      pending: this.friendsService.getPendingRequests(),
      unread: this.chatService.getUnreadCountsByFriend(),
      meetupInvitations: this.meetupService.getPendingInvitationsCount()
    }).subscribe({
      next: ({ pending, unread, meetupInvitations }: any) => {
        const pendingCount = pending?.pendingRequests?.length || 0;

        const unreadMap = unread?.unreadMessagesByFriend || {};
        const unreadTotal = Object.values(unreadMap).reduce(
          (sum: number, count: any) => sum + Number(count || 0),
          0
        );

        const meetupPending = meetupInvitations?.pendingInvitationsCount || 0;
        const hasMeetupPending = !!meetupInvitations?.hasPendingMeetupInvitations;

        this.setMeetupInvitations({
          hasPending: hasMeetupPending,
          count: meetupPending
        });

        this.setHasFriendsNotifications(
          pendingCount > 0 || unreadTotal > 0 || meetupPending > 0
        );
      },
      error: (err) => {
        if (err?.status === 401) {
          this.clearNotifications();
          this.authService.clearSession();
          return;
        }
        console.error('Error al refrescar notificaciones globales:', err);
      }
    });
  }
}