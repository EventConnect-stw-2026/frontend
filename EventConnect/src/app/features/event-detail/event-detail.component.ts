/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: event-detail.component.ts
 * Descripción: Componente encargado de mostrar el detalle de un evento, gestionar la asistencia,
 * el chat del evento, los amigos asistentes, el minimapa y los reportes.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

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

// Componente encargado de gestionar la vista de detalle de un evento.
// Carga la información del evento, controla la asistencia del usuario
// y permite interactuar con el chat, el mapa y el sistema de reportes.
@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, StripHtmlPipe, FormsModule],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
})
export class EventDetailComponent implements OnInit, AfterViewInit, OnDestroy {

  // Datos principales del evento mostrado en pantalla.
  event: any = null;

  // Indica si la información principal del evento se está cargando.
  loading = true;

  // Indica si ha ocurrido algún error al recuperar el evento.
  error = false;

  // Controla si el usuario autenticado está apuntado al evento.
  isAttending = false;

  // Pestaña activa del panel lateral del evento.
  activeTab: 'chat' | 'amigos' = 'chat';

  // Identificador del usuario autenticado.
  currentUserId = '';

  // Lista de mensajes del chat asociado al evento.
  messages: any[] = [];

  // Texto escrito por el usuario antes de enviarlo al chat.
  newMessage = '';

  // Evita envíos duplicados mientras un mensaje está siendo enviado.
  sendingMessage = false;

  // Temporizador utilizado para refrescar periódicamente el chat.
  private pollTimer: any;

  // Lista de amigos del usuario que también asisten al evento.
  friendsAttending: any[] = [];

  // Indica si se está cargando el listado de amigos asistentes.
  loadingFriends = false;

  // Control de visibilidad del toast de notificación.
  toastVisible = false;

  // Mensaje mostrado dentro del toast.
  toastMessage = '';

  // Tipo de toast que determina si se muestra como éxito o error.
  toastType: 'success' | 'error' = 'success';

  // Temporizador utilizado para ocultar automáticamente el toast.
  private toastTimer: any;

  // Evita inicializar el minimapa más de una vez.
  private mapInitialized = false;

  // Servicio para acceder a los parámetros de la ruta actual.
  private route = inject(ActivatedRoute);

  // Servicio de autenticación utilizado para consultar el perfil del usuario.
  private authService = inject(AuthService);

  // Servicio utilizado para consultar eventos y gestionar asistencia.
  private eventService = inject(EventService);

  // Identificador de plataforma usado para evitar ejecutar lógica de navegador en SSR.
  private platformId = inject(PLATFORM_ID);

  // Referencia para forzar la detección de cambios cuando se actualizan datos.
  private cdr = inject(ChangeDetectorRef);

  // Cliente HTTP disponible para posibles peticiones auxiliares del componente.
  private http = inject(HttpClient);

  // Servicio utilizado para cargar mensajes y amigos asistentes del evento.
  private eventChatService = inject(EventChatService);

  // Servicio utilizado para crear reportes sobre eventos, usuarios o mensajes.
  private reportService = inject(ReportService);

  // Controla la visibilidad del modal de reporte.
  reportVisible = false;

  // Elemento que se va a reportar: evento, usuario o mensaje.
  reportTarget: any = null;

  // Motivo seleccionado para el reporte.
  reportReason = 'other';

  // Descripción escrita por el usuario al enviar el reporte.
  reportDescription = '';

  // Indica si el reporte se está enviando al backend.
  reportLoading = false;

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Obtiene el id del evento desde la URL y carga sus datos desde el backend.
  // Después comprueba la asistencia, carga el chat y activa el refresco periódico.
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.eventService.getEventById(id).subscribe({
          next: (res: any) => {
            this.event = res.data;
            this.loading = false;
            this.cdr.detectChanges();

            // Tras cargar el evento, se inicializan los datos dependientes del usuario y del chat.
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

  // Método privado para comprobar si el usuario actual asiste al evento.
  // Solicita el perfil actualizado al backend para evitar usar datos antiguos.
  // También guarda el identificador del usuario autenticado si existe en caché.
  private checkAttendance(eventId: string) {
    this.authService.getProfile().subscribe({
      next: (profile: any) => {
        this.isAttending = (profile.attendedEvents ?? [])
          .some((id: any) => id.toString() === eventId);

        const cached = this.authService.getCurrentUser();
        if (cached) this.currentUserId = cached._id ?? cached.sub ?? '';

        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  // Método para cambiar entre la pestaña de chat y la pestaña de amigos.
  // Según la pestaña seleccionada, carga los mensajes del evento o los amigos asistentes.
  // Permite que el panel lateral muestre siempre información actualizada.
  switchTab(tab: 'chat' | 'amigos') {
    this.activeTab = tab;
    if (tab === 'chat' && this.event?._id) {
      this.loadMessages();
    } else if (tab === 'amigos' && this.event?._id) {
      this.loadFriendsAttending();
    }
  }

  // Método para cargar los mensajes del chat del evento.
  // Solicita al backend los mensajes asociados al evento actual.
  // Actualiza la vista después de recibir la respuesta.
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

  // Método para iniciar el refresco periódico del chat.
  // Antes de crear un nuevo intervalo, elimina cualquier polling anterior.
  // Solo recarga mensajes si la pestaña activa es la del chat.
  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.activeTab === 'chat') this.loadMessages();
    }, 5000);
  }

  // Método para detener el refresco periódico del chat.
  // Limpia el intervalo activo para evitar peticiones innecesarias.
  // Se utiliza al destruir el componente o reiniciar el polling.
  stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  // Método para enviar un mensaje al chat del evento.
  // Valida que haya contenido, que no exista otro envío activo y que el evento exista.
  // Si el backend responde correctamente, añade el mensaje a la lista local.
  sendMessage() {
    const content = this.newMessage.trim();
    if (!content || this.sendingMessage || !this.event?._id) return;

    this.sendingMessage = true;

    this.eventChatService.sendMessage(this.event._id, content).subscribe({
      next: (res) => {
        this.messages = [...this.messages, res.data];
        this.newMessage = '';
        this.sendingMessage = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.sendingMessage = false;

        // Si el usuario no está autenticado, se informa mediante una notificación.
        if (err.status === 401) this.showToast('Inicia sesión para escribir en el chat', 'error');
      }
    });
  }

  // Método para abrir el modal de reporte sobre un mensaje.
  // Guarda el mensaje como objetivo del reporte y prepara los campos del formulario.
  // Permite reportar contenido concreto escrito dentro del chat del evento.
  openReportForMessage(msg: any) {
    this.reportTarget = {
      type: 'message',
      relatedId: msg._id,
      involvedUserId: msg.sender._id,
      title: `Mensaje de ${msg.sender.name}`
    };
    this.reportReason = 'other';
    this.reportDescription = '';
    this.reportVisible = true;
    this.cdr.detectChanges();
  }

  // Método para abrir el modal de reporte sobre un usuario.
  // Comprueba que el usuario tenga identificador antes de preparar el reporte.
  // Se utiliza desde acciones asociadas a usuarios o mensajes del chat.
  openReportForUser(user: any) {
    if (!user?._id) return;

    this.reportTarget = {
      type: 'user',
      involvedUserId: user._id,
      relatedId: user._id,
      title: `Usuario: ${user.name}`
    };
    this.reportReason = 'other';
    this.reportDescription = '';
    this.reportVisible = true;
    this.cdr.detectChanges();
  }

  // Método para abrir el modal de reporte sobre el evento actual.
  // Utiliza el identificador del evento como elemento relacionado.
  // Permite notificar problemas generales del evento mostrado.
  openReportForEvent() {
    if (!this.event?._id) return;

    this.reportTarget = {
      type: 'event',
      relatedId: this.event._id,
      title: `Evento: ${this.event.title}`
    };
    this.reportReason = 'other';
    this.reportDescription = '';
    this.reportVisible = true;
    this.cdr.detectChanges();
  }

  // Método para enviar el reporte al backend.
  // Construye el payload según el tipo de elemento reportado.
  // Muestra un toast de éxito o error dependiendo del resultado.
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

  // Método para cerrar el modal de reporte.
  // Oculta el formulario y elimina el objetivo seleccionado.
  // Se utiliza al cancelar o terminar una acción de reporte.
  closeReport() {
    this.reportVisible = false;
    this.reportTarget = null;
  }

  // Método para gestionar el envío del mensaje con la tecla Enter.
  // Evita el salto de línea cuando no se mantiene pulsado Shift.
  // Llama al envío del mensaje como si se pulsara el botón correspondiente.
  onEnter(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  // Método para cargar los amigos que también asisten al evento.
  // Solicita al backend la lista de asistentes relacionados con el usuario.
  // Actualiza el estado de carga y refresca la vista al finalizar.
  loadFriendsAttending() {
    if (!this.event?._id) return;

    this.loadingFriends = true;

    this.eventChatService.getFriendsAttending(this.event._id).subscribe({
      next: (res) => {
        this.friendsAttending = res.data ?? [];
        this.loadingFriends = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingFriends = false;
      }
    });
  }

  // Método para mostrar una notificación temporal.
  // Recibe el mensaje y el tipo de aviso que debe mostrarse.
  // Oculta automáticamente el toast pasados tres segundos.
  showToast(message: string, type: 'success' | 'error' = 'success') {
    clearTimeout(this.toastTimer);

    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.cdr.detectChanges();

    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  // Método para apuntar o desapuntar al usuario del evento.
  // Llama al backend para alternar la asistencia y actualiza el estado local.
  // También refresca el perfil para que otras vistas reaccionen al cambio.
  onAttendClick() {
    if (!this.event || !this.event._id) return;

    this.eventService.toggleAttend(this.event._id).subscribe({
      next: (res: any) => {
        this.isAttending = res.isAttending;
        this.cdr.detectChanges();
        this.showToast(res.message, res.isAttending ? 'success' : 'error');

        // Se refresca el perfil para actualizar los attendedEvents en el estado global.
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

  // Método del ciclo de vida ejecutado al destruir el componente.
  // Detiene el polling del chat y limpia el temporizador del toast.
  // Evita fugas de memoria y actualizaciones sobre componentes destruidos.
  ngOnDestroy() {
    this.stopPolling();
    clearTimeout(this.toastTimer);
  }

  // Método ejecutado después de inicializar la vista.
  // Espera a que existan los datos de ubicación del evento para crear el minimapa.
  // Solo se ejecuta en navegador para evitar errores en renderizado del servidor.
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

  // Método para sustituir la imagen del evento si falla la carga.
  // Asigna una imagen local por defecto para evitar que quede rota en la interfaz.
  onImgError(event: any) {
    event.target.src = 'assets/images/placeholder.svg';
  }

  // Método para obtener un emoji representativo según la categoría del evento.
  // Utiliza un mapa de categorías conocidas y devuelve un marcador genérico si no coincide.
  // El emoji se usa dentro del icono personalizado del minimapa.
  getEmoji(category: string): string {
    const map: any = {
      'Deporte': '⚽', 'Deportivo': '⚽', 'Música': '🎵',
      'Cultural': '🎭', 'Cultura': '🎭', 'Social': '👥',
      'Educativo': '📚', 'Gastronómico': '🍽️',
      'Empresarial': '💼', 'Religioso': '⛪'
    };
    return map[category] || '📍';
  }

  // Método para inicializar el minimapa del evento con Leaflet.
  // Carga la librería dinámicamente, centra el mapa en las coordenadas del evento
  // y añade un marcador personalizado con el emoji de la categoría.
  async initMiniMap() {
    const L = await import('leaflet');
    const mapContainer = document.getElementById('mini-map');
    if (!mapContainer) return;

    const map = L.map(mapContainer, {
      center: [this.event.latitude, this.event.longitude],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const emoji = this.getEmoji(this.event.category);

    const icon = L.divIcon({
      html: `<div style="width:40px;height:40px;background:white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.25);border:2px solid #2563eb;font-size:18px;"><span style="transform:rotate(45deg)">${emoji}</span></div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    L.marker([this.event.latitude, this.event.longitude], { icon }).addTo(map);

    // Se recalcula el tamaño para que Leaflet se adapte correctamente al contenedor visible.
    setTimeout(() => map.invalidateSize(), 200);
  }
}