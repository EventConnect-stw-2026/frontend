import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { FriendsService } from '../../core/services/friends.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { HeaderComponent } from '../../layout/components/header/header';
import { NotificationsService } from '../../core/services/notifications.service';
import { MeetupService } from '../../core/services/meetup.service';

@Component({
  standalone: true,
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.scss',
  imports: [CommonModule, FormsModule, HeaderComponent]
})
export class FriendsComponent implements OnInit {
  private friendsService = inject(FriendsService);
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private notificationsService = inject(NotificationsService);
  private meetupService = inject(MeetupService);

  hasPendingMeetupInvitations = false;

  friends: any[] = [];
  pendingRequests: any[] = [];
  sentRequests: any[] = [];
  suggestedUsers: any[] = [];
  allUsers: any[] = [];

  searchTerm = '';
  searchAddFriendTerm = '';
  isLoading = false;
  currentUserId = '';
  showAddFriendModal = false;
  searchTimeout: any;
  isSearchingUsers = false;

  showConfirmDelete = false;
  friendToDeleteId: string | null = null;
  friendToDeleteName = '';
  typingStarted = false;

  sendingRequestIds = new Set<string>();
  acceptingRequestIds = new Set<string>();
  rejectingRequestIds = new Set<string>();
  removingFriendIds = new Set<string>();
  cancellingRequestIds = new Set<string>();
  openingChatIds = new Set<string>();

  unreadMessagesByFriend: Record<string, number> = {};

  ngOnInit(): void {
    const user = this.authService.getCurrentUser() as any;
    this.currentUserId = user?._id || '';
    this.loadFriends();
    this.loadPendingRequests();
    this.loadSentRequests();
    this.loadSuggestedUsers();
    this.loadUnreadMessages();
    this.notificationsService.meetupInvitations$.subscribe(data => {
      this.hasPendingMeetupInvitations = data?.hasPending || false;
      this.cdr.detectChanges();
    });

  this.notificationsService.refreshAllFriendsNotifications();  }

  private filterAvailableUsers(users: any[]): any[] {
    return users.filter((user: any) =>
      user._id !== this.currentUserId &&
      !this.friends.find(f => f._id === user._id) &&
      !this.pendingRequests.find(p => p.fromUser._id === user._id)
    );
  }

  loadFriends(): void {
    this.isLoading = true;
    this.friendsService.getFriends().subscribe({
      next: (res) => {
        this.friends = res.friends;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar amigos:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPendingRequests(): void {
    this.friendsService.getPendingRequests().subscribe({
      next: (res) => {
        this.pendingRequests = res.pendingRequests;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
      }
    });
  }

  loadSentRequests(): void {
    this.friendsService.getSentRequests().subscribe({
      next: (res) => {
        this.sentRequests = res.sentRequests;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar solicitudes enviadas:', err);
      }
    });
  }

  loadSuggestedUsers(): void {
    this.friendsService.getSuggestedFriends().subscribe({
      next: (res: any) => {
        this.suggestedUsers = res.suggestedFriends;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar usuarios sugeridos:', err);
      }
    });
  }

  loadUnreadMessages(): void {
    this.chatService.getUnreadCountsByFriend().subscribe({
      next: (res: any) => {
        this.unreadMessagesByFriend = res?.unreadMessagesByFriend || {};
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar mensajes no leídos:', err);
        this.unreadMessagesByFriend = {};
        this.cdr.detectChanges();
      }
    });
  }


  refreshHeaderNotifications(): void {
    this.notificationsService.refreshAllFriendsNotifications();
  }

  sendFriendRequest(friendId: string): void {
    if (this.sendingRequestIds.has(friendId)) return;

    this.sendingRequestIds = new Set(this.sendingRequestIds).add(friendId);
    this.cdr.detectChanges();

    this.friendsService.sendFriendRequest(friendId)
      .pipe(
        finalize(() => {
          const next = new Set(this.sendingRequestIds);
          next.delete(friendId);
          this.sendingRequestIds = next;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.suggestedUsers = this.suggestedUsers.filter(u => u._id !== friendId);
          this.loadSentRequests();
          this.allUsers = this.allUsers.map(u =>
            u._id === friendId ? { ...u, requestSent: true } : u
          );
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al enviar solicitud:', err);
        }
      });
  }

  acceptRequest(requestId: string): void {
    if (this.acceptingRequestIds.has(requestId)) return;

    this.acceptingRequestIds = new Set(this.acceptingRequestIds).add(requestId);
    this.cdr.detectChanges();

    this.friendsService.acceptFriendRequest(requestId)
      .pipe(
        finalize(() => {
          const next = new Set(this.acceptingRequestIds);
          next.delete(requestId);
          this.acceptingRequestIds = next;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadFriends();
          this.loadPendingRequests();
          this.loadSuggestedUsers();
          this.refreshHeaderNotifications();
        },
        error: (err) => {
          console.error('Error al aceptar solicitud:', err);
        }
      });
  }

  rejectRequest(requestId: string): void {
    if (this.rejectingRequestIds.has(requestId)) return;

    this.rejectingRequestIds = new Set(this.rejectingRequestIds).add(requestId);
    this.cdr.detectChanges();

    this.friendsService.rejectFriendRequest(requestId)
      .pipe(
        finalize(() => {
          const next = new Set(this.rejectingRequestIds);
          next.delete(requestId);
          this.rejectingRequestIds = next;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadPendingRequests();
          this.refreshHeaderNotifications();
        },
        error: (err) => {
          console.error('Error al rechazar solicitud:', err);
        }
      });
  }

  openDeleteConfirm(friendId: string, friendName: string): void {
    this.friendToDeleteId = friendId;
    this.friendToDeleteName = friendName;
    this.showConfirmDelete = true;
    this.cdr.detectChanges();
  }

  closeDeleteConfirm(): void {
    this.friendToDeleteId = null;
    this.friendToDeleteName = '';
    this.showConfirmDelete = false;
    this.cdr.detectChanges();
  }

  confirmRemoveFriend(): void {
    if (!this.friendToDeleteId) return;
    if (this.removingFriendIds.has(this.friendToDeleteId)) return;

    const friendId = this.friendToDeleteId;
    this.removingFriendIds = new Set(this.removingFriendIds).add(friendId);
    this.cdr.detectChanges();

    this.friendsService.removeFriend(friendId)
      .pipe(
        finalize(() => {
          const next = new Set(this.removingFriendIds);
          next.delete(friendId);
          this.removingFriendIds = next;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadFriends();
          this.loadSuggestedUsers();
          this.closeDeleteConfirm();
        },
        error: (err) => {
          console.error('Error al eliminar amigo:', err);
          this.closeDeleteConfirm();
        }
      });
  }

  openChat(friendId: string): void {
    if (!friendId) return;
    if (this.openingChatIds.has(friendId)) return;

    this.openingChatIds = new Set(this.openingChatIds).add(friendId);
    this.cdr.detectChanges();

    this.chatService.createOrGetConversation(friendId)
      .pipe(
        finalize(() => {
          const next = new Set(this.openingChatIds);
          next.delete(friendId);
          this.openingChatIds = next;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          const conversationId = res?.conversation?._id;
          if (!conversationId) return;

          this.unreadMessagesByFriend = {
            ...this.unreadMessagesByFriend,
            [friendId]: 0
          };
          this.cdr.detectChanges();

          this.router.navigate(['/chat', conversationId]);
        },
        error: (err) => {
          console.error('Error al abrir chat:', err);
        }
      });
  }

  get filteredFriends() {
    return this.friends.filter(friend =>
      friend.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      friend.username.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openAddFriendModal(): void {
    this.showAddFriendModal = true;
    this.searchAddFriendTerm = '';
    this.allUsers = [];
    this.typingStarted = false;
    this.cdr.detectChanges();
  }

  closeAddFriendModal(): void {
    clearTimeout(this.searchTimeout);
    this.showAddFriendModal = false;
    this.searchAddFriendTerm = '';
    this.allUsers = [];
    this.typingStarted = false;
    this.isSearchingUsers = false;
    this.cdr.detectChanges();
  }

  onSearchAddFriend(): void {
    clearTimeout(this.searchTimeout);

    const term = this.searchAddFriendTerm.trim();
    this.typingStarted = term.length > 0;

    if (!term) {
      this.allUsers = [];
      this.isSearchingUsers = false;
      this.cdr.detectChanges();
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.isSearchingUsers = true;
      this.cdr.detectChanges();

      this.friendsService.searchUsers(term).subscribe({
        next: (res: any) => {
          this.allUsers = this.filterAvailableUsers(res.users || []).map(u => ({
            ...u,
            requestSent: this.sentRequests.some(s => s.toUser._id === u._id)
              || this.sentRequests.some(s => s.toUser === u._id)
          }));
          this.isSearchingUsers = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error al buscar usuarios:', err);
          this.isSearchingUsers = false;
          this.cdr.detectChanges();
        }
      });
    }, 120);
  }

  get filteredAddFriendUsers() {
    return this.allUsers;
  }

  goToMeetups(): void {
    this.router.navigate(['/meetups']);
  }
}