import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';
import { EventChatService } from '../../core/services/event-chat.service';
import { ReportService } from '../../core/services/report.service';
import { HeaderComponent } from '../../layout/components/header/header';
import { StripHtmlPipe } from '../../shared/pipes/strip-html.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, StripHtmlPipe, FormsModule],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
})
export class EventDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  event: any = null;
  loading = true;
  error = false;
  isAttending = false;
  activeTab: 'chat' | 'amigos' = 'chat';

  currentUserId      = '';
  // Chat
  messages: any[]    = [];
  newMessage         = '';
  sendingMessage     = false;
  private pollTimer: any;

  // Amigos
  friendsAttending: any[] = [];
  loadingFriends          = false;
  toastVisible  = false;
  toastMessage  = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  private mapInitialized = false;

  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private eventService = inject(EventService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private http            = inject(HttpClient);
  private eventChatService = inject(EventChatService);
  private reportService = inject(ReportService);

  // Report UI
  reportVisible = false;
  reportTarget: any = null; // { type, relatedId?, involvedUserId?, title? }
  reportReason = 'other';
  reportDescription = '';
  reportLoading = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.eventService.getEventById(id).subscribe({
          next: (res: any) => {
            this.event = res.data;
            this.loading = false;
            this.cdr.detectChanges();
            // Comprobar si el usuario ya está apuntado
            this.checkAttendance(id);
            this.loadMessages();
            this.startPolling();
          },
          error: () => {
            this.error = true;
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    }
  }

  private checkAttendance(eventId: string) {
    // Siempre pedir el perfil fresco al backend para garantizar datos actualizados
    // El caché puede estar vacío tras un nuevo login
    this.authService.getProfile().subscribe({
      next: (profile: any) => {
        this.isAttending = (profile.attendedEvents ?? [])
          .some((id: any) => id.toString() === eventId);
        const cached = this.authService.getCurrentUser();
        if (cached) this.currentUserId = cached._id ?? cached.sub ?? '';
        this.cdr.detectChanges();
      },
      error: () => {} // no logueado → isAttending queda false
    });
  }

  // ── Tab change ────────────────────────────────────────────────────────────
  switchTab(tab: 'chat' | 'amigos') {
    this.activeTab = tab;
    if (tab === 'chat' && this.event?._id) {
      this.loadMessages();
    } else if (tab === 'amigos' && this.event?._id) {
      this.loadFriendsAttending();
    }
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  loadMessages() {
    if (!this.event?._id) return;
    this.eventChatService.getMessages(this.event._id).subscribe({
        next: (res) => {
          this.messages = res.data ?? [];
          this.cdr.detectChanges();
        },
        error: () => {}
      });
  }

  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.activeTab === 'chat') this.loadMessages();
    }, 5000);
  }

  stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  sendMessage() {
    const content = this.newMessage.trim();
    if (!content || this.sendingMessage || !this.event?._id) return;

    this.sendingMessage = true;
    this.eventChatService.sendMessage(this.event._id, content).subscribe({
      next: (res) => {
        this.messages = [...this.messages, res.data];
        this.newMessage    = '';
        this.sendingMessage = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.sendingMessage = false;
        if (err.status === 401) this.showToast('Inicia sesión para escribir en el chat', 'error');
      }
    });
  }

  // ── Report logic ─────────────────────────────────────────────────────────
  openReportForMessage(msg: any) {
    this.reportTarget = { type: 'message', relatedId: msg._id, involvedUserId: msg.sender._id, title: `Mensaje de ${msg.sender.name}` };
    this.reportReason = 'other';
    this.reportDescription = '';
    this.reportVisible = true;
    this.cdr.detectChanges();
  }

  openReportForUser(user: any) {
    if (!user?._id) return;
    this.reportTarget = { type: 'user', involvedUserId: user._id, relatedId: user._id, title: `Usuario: ${user.name}` };
    this.reportReason = 'other';
    this.reportDescription = '';
    this.reportVisible = true;
    this.cdr.detectChanges();
  }

  openReportForEvent() {
    if (!this.event?._id) return;
    this.reportTarget = { type: 'event', relatedId: this.event._id, title: `Evento: ${this.event.title}` };
    this.reportReason = 'other';
    this.reportDescription = '';
    this.reportVisible = true;
    this.cdr.detectChanges();
  }

  submitReport() {
    if (!this.reportTarget) return;
    this.reportLoading = true;
    const payload: any = {
      type: this.reportTarget.type,
      description: this.reportDescription,
      reason: this.reportReason
    };
    if (this.reportTarget.relatedId) payload.relatedId = this.reportTarget.relatedId;
    if (this.reportTarget.involvedUserId) payload.involvedUserId = this.reportTarget.involvedUserId;

    this.reportService.createReport(payload).subscribe({
      next: () => {
        this.reportLoading = false;
        this.reportVisible = false;
        this.showToast('Reporte enviado. Gracias por colaborar.', 'success');
      },
      error: (err) => {
        this.reportLoading = false;
        this.showToast(err?.error?.message || 'Error enviando reporte', 'error');
      }
    });
  }

  closeReport() {
    this.reportVisible = false;
    this.reportTarget = null;
  }

  onEnter(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  // ── Amigos ────────────────────────────────────────────────────────────────
  loadFriendsAttending() {
    if (!this.event?._id) return;
    this.loadingFriends = true;
    this.eventChatService.getFriendsAttending(this.event._id).subscribe({
      next: (res) => {
        this.friendsAttending = res.data ?? [];
        this.loadingFriends   = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingFriends = false; }
    });
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType    = type;
    this.toastVisible = true;
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  onAttendClick() {
    if (!this.event || !this.event._id) return;
    this.eventService.toggleAttend(this.event._id).subscribe({
      next: (res: any) => {
        this.isAttending = res.isAttending;
        this.cdr.detectChanges();
        this.showToast(res.message, res.isAttending ? 'success' : 'error');
        // Refrescar el perfil para que currentUser$ emita con los attendedEvents actualizados
        // Esto hace que el home reaccione y muestre/oculte la sección de recomendaciones
        this.authService.getProfile().subscribe();
      },
      error: (err: any) => {
        if (err.status === 401) {
          this.showToast('Tienes que iniciar sesión para apuntarte.', 'error');
        } else {
          this.showToast('Hubo un problema al apuntarte. Inténtalo de nuevo.', 'error');
        }
      }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
    clearTimeout(this.toastTimer);
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const check = setInterval(async () => {
      if (this.event && this.event.latitude != null && this.event.longitude != null && !this.mapInitialized) {
        await this.initMiniMap();
        this.mapInitialized = true;
        clearInterval(check);
      }
    }, 100);
  }

  onImgError(event: any) {
    event.target.src = 'assets/images/placeholder.svg';
  }

  getEmoji(category: string): string {
    const map: any = {
      'Deporte': '⚽', 'Deportivo': '⚽', 'Música': '🎵',
      'Cultural': '🎭', 'Cultura': '🎭', 'Social': '👥',
      'Educativo': '📚', 'Gastronómico': '🍽️',
      'Empresarial': '💼', 'Religioso': '⛪'
    };
    return map[category] || '📍';
  }

  async initMiniMap() {
    const L = await import('leaflet');
    const mapContainer = document.getElementById('mini-map');
    if (!mapContainer) return;

    const map = L.map(mapContainer, {
      center: [this.event.latitude, this.event.longitude],
      zoom: 15, zoomControl: false, dragging: false,
      scrollWheelZoom: false, doubleClickZoom: false,
      boxZoom: false, keyboard: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const emoji = this.getEmoji(this.event.category);
    const icon = L.divIcon({
      html: `<div style="width:40px;height:40px;background:white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.25);border:2px solid #2563eb;font-size:18px;"><span style="transform:rotate(45deg)">${emoji}</span></div>`,
      className: '', iconSize: [40, 40], iconAnchor: [20, 40],
    });

    L.marker([this.event.latitude, this.event.longitude], { icon }).addTo(map);
    setTimeout(() => map.invalidateSize(), 200);
  }
}