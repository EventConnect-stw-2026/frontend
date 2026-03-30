import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { HeaderComponent } from '../../layout/components/header/header';
import { FriendsService } from '../../core/services/friends.service';
import { EventService } from '../../core/services/event.service';
import { MeetupService } from '../../core/services/meetup.service';
import { StripHtmlPipe } from '../../shared/pipes/strip-html.pipe';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-meetups',
  templateUrl: './meetups.component.html',
  styleUrl: './meetups.component.scss',
  imports: [CommonModule, FormsModule, HeaderComponent, StripHtmlPipe]
})
export class MeetupsComponent implements OnInit {
  private friendsService = inject(FriendsService);
  private eventService = inject(EventService);
  private meetupService = inject(MeetupService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  currentUserId = '';

  friends: any[] = [];
  events: any[] = [];
  organizedMeetups: any[] = [];
  invitedMeetups: any[] = [];

  selectedFriendIds = new Set<string>();
  selectedEventId = '';

  searchFriendTerm = '';
  selectedCategory = '';
  eventPage = 1;
  eventTotalPages = 1;

  loadingFriends = false;
  loadingEvents = false;
  loadingOrganized = false;
  loadingInvited = false;
  creatingMeetup = false;

  showCreateModal = false;
  meetupDateTime = '';
  meetupPlace = '';

  activeTab: 'create' | 'organized' | 'invited' = 'create';

  categories = [
    'Deporte',
    'Música',
    'Teatro y Artes Escénicas',
    'Artes plásticas',
    'Cursos y Talleres',
    'Formación',
    'Ocio y Juegos',
    'Turismo',
    'Gastronomía',
    'Aire Libre y Excursiones',
    'Medio Ambiente y Naturaleza',
    'Conferencias y Congresos',
    'Imagen y sonido',
    'Idiomas',
    'Desarrollo personal',
    'Otros',
  ];

  ngOnInit(): void {
    const user = this.authService.getCurrentUser() as any;
    this.currentUserId = user?._id || '';

    this.loadFriends();
    this.loadEvents();
    this.loadOrganizedMeetups();
    this.loadInvitedMeetups();
  }

  loadFriends(): void {
    this.loadingFriends = true;

    this.friendsService.getFriends()
      .pipe(finalize(() => {
        this.loadingFriends = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.friends = res.friends || [];
        },
        error: (err) => {
          console.error('Error al cargar amigos:', err);
        }
      });
  }

  loadEvents(): void {
    this.loadingEvents = true;

    const filters: any = {};
    if (this.selectedCategory) filters.category = this.selectedCategory;
    filters.status = 'active';

    this.eventService.getEvents(this.eventPage, 8, filters)
      .pipe(finalize(() => {
        this.loadingEvents = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.events = res.data || [];
          this.eventTotalPages = res.totalPages || 1;
        },
        error: (err) => {
          console.error('Error al cargar eventos:', err);
        }
      });
  }

  loadOrganizedMeetups(): void {
    this.loadingOrganized = true;

    this.meetupService.getOrganizedMeetups()
      .pipe(finalize(() => {
        this.loadingOrganized = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.organizedMeetups = res.meetups || [];
        },
        error: (err) => {
          console.error('Error al cargar quedadas organizadas:', err);
        }
      });
  }

  loadInvitedMeetups(): void {
    this.loadingInvited = true;

    this.meetupService.getInvitedMeetups()
      .pipe(finalize(() => {
        this.loadingInvited = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.invitedMeetups = res.meetups || [];
        },
        error: (err) => {
          console.error('Error al cargar quedadas invitadas:', err);
        }
      });
  }

  toggleFriendSelection(friendId: string): void {
    const next = new Set(this.selectedFriendIds);
    if (next.has(friendId)) {
      next.delete(friendId);
    } else {
      next.add(friendId);
    }
    this.selectedFriendIds = next;
    this.cdr.detectChanges();
  }

  selectEvent(eventId: string): void {
    this.selectedEventId = this.selectedEventId === eventId ? '' : eventId;
    this.cdr.detectChanges();
  }

  selectCategory(category: string): void {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.eventPage = 1;
    this.loadEvents();
  }

  prevPage(): void {
    if (this.eventPage > 1) {
      this.eventPage--;
      this.loadEvents();
    }
  }

  nextPage(): void {
    if (this.eventPage < this.eventTotalPages) {
      this.eventPage++;
      this.loadEvents();
    }
  }

  openCreateModal(): void {
    if (!this.selectedEventId || this.selectedFriendIds.size === 0) return;
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.meetupDateTime = '';
    this.meetupPlace = '';
    this.cdr.detectChanges();
  }

  createMeetup(): void {
    if (!this.selectedEventId || this.selectedFriendIds.size === 0) return;
    if (!this.meetupDateTime || !this.meetupPlace.trim()) return;

    this.creatingMeetup = true;

    this.meetupService.createMeetup({
      eventId: this.selectedEventId,
      friendIds: Array.from(this.selectedFriendIds),
      meetupDateTime: this.meetupDateTime,
      meetupPlace: this.meetupPlace.trim()
    })
      .pipe(finalize(() => {
        this.creatingMeetup = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.selectedFriendIds = new Set<string>();
          this.selectedEventId = '';
          this.closeCreateModal();
          this.loadOrganizedMeetups();
          this.activeTab = 'organized';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al crear quedada:', err);
        }
      });
  }

  respondToMeetup(meetupId: string, response: 'accepted' | 'rejected'): void {
    this.meetupService.respondToMeetup(meetupId, response).subscribe({
      next: () => {
        this.loadInvitedMeetups();
      },
      error: (err) => {
        console.error('Error al responder quedada:', err);
      }
    });
  }

  cancelMeetup(meetupId: string): void {
    this.meetupService.cancelMeetup(meetupId).subscribe({
      next: () => {
        this.loadOrganizedMeetups();
        this.loadInvitedMeetups();
      },
      error: (err) => {
        console.error('Error al cancelar quedada:', err);
      }
    });
  }

  get filteredFriends(): any[] {
    const term = this.searchFriendTerm.trim().toLowerCase();
    if (!term) return this.friends;

    return this.friends.filter(friend =>
      friend.name?.toLowerCase().includes(term) ||
      friend.username?.toLowerCase().includes(term)
    );
  }

  get selectedFriendsCount(): number {
    return this.selectedFriendIds.size;
  }

  get canOpenCreateModal(): boolean {
    return !!this.selectedEventId && this.selectedFriendIds.size > 0;
  }

  getParticipantResponse(meetup: any): string {
    if (!this.currentUserId) return '';

    const participant = meetup?.participants?.find(
      (p: any) => (p.user?._id || p.user) === this.currentUserId
    );

    return participant?.response || 'pending';
  }
}