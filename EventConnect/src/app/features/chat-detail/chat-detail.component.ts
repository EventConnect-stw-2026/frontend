/**
 * Aplicación: EventConnect - Plataforma de gestión de eventos
 * Archivo: chat-detail.component.ts
 * Descripción: Componente encargado de mostrar y gestionar una conversación privada entre usuarios.
 * Autor: Pablo Báscones, Mario Caudevilla, Mario Hernández y David Borrel
 */

import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  AfterViewChecked
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { forkJoin } from 'rxjs';

import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { FriendsService } from '../../core/services/friends.service';
import { HeaderComponent } from '../../layout/components/header/header';
import { NotificationsService } from '../../core/services/notifications.service';

// Componente encargado de gestionar el detalle de una conversación.
// Carga los mensajes, permite enviar nuevos mensajes
// y actualiza las notificaciones relacionadas con el chat.
@Component({
  standalone: true,
  selector: 'app-chat-detail',
  templateUrl: './chat-detail.component.html',
  styleUrl: './chat-detail.component.scss',
  imports: [CommonModule, FormsModule, HeaderComponent]
})
export class ChatDetailComponent implements OnInit, AfterViewChecked {

  // Servicio para acceder a los parámetros de la ruta actual.
  private route = inject(ActivatedRoute);

  // Servicio utilizado para consultar conversaciones y enviar mensajes.
  private chatService = inject(ChatService);

  // Servicio de autenticación utilizado para obtener el usuario actual.
  private authService = inject(AuthService);

  // Servicio de amistades utilizado para actualizar notificaciones del header.
  private friendsService = inject(FriendsService);

  // Referencia para forzar la detección de cambios cuando se actualizan datos.
  private cdr = inject(ChangeDetectorRef);

  // Servicio utilizado para volver a la pantalla anterior.
  private location = inject(Location);

  // Servicio global de notificaciones de la aplicación.
  private notificationsService = inject(NotificationsService);

  // Referencia al contenedor HTML donde se muestran los mensajes.
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  // Identificador de la conversación obtenido desde la URL.
  conversationId = '';

  // Datos generales de la conversación actual.
  conversation: any = null;

  // Lista de mensajes mostrados en la conversación.
  messages: any[] = [];

  // Texto escrito por el usuario antes de enviarlo.
  newMessage = '';

  // Identificador del usuario autenticado.
  currentUserId = '';

  // Indica si los mensajes se están cargando.
  isLoading = false;

  // Controla si debe hacerse scroll automático al final del chat.
  shouldScrollToBottom = false;

  // Método del ciclo de vida ejecutado al inicializar el componente.
  // Obtiene el ID de conversación, recupera el usuario actual
  // y carga los mensajes de la conversación.
  ngOnInit(): void {
    this.conversationId = this.route.snapshot.paramMap.get('conversationId') || '';

    // Se intenta obtener primero el usuario desde la caché del servicio.
    const cached = this.authService.getCurrentUser();
    if (cached?._id) {
      this.currentUserId = cached._id;
      if (this.conversationId) {
        this.loadMessages();
        this.markAsRead();
      }
    } else {

      // Si el usuario no está cacheado, se solicita el perfil al backend.
      this.authService.getProfile().pipe(
        finalize(() => this.cdr.detectChanges())
      ).subscribe({
        next: (user) => {
          this.currentUserId = user?._id ?? user?.id ?? '';
          if (this.conversationId) {
            this.loadMessages();
            this.markAsRead();
          }
        },
        error: () => {

          // Si no se obtiene perfil, se cargan los mensajes igualmente.
          if (this.conversationId) {
            this.loadMessages();
          }
        }
      });
    }
  }

  // Método ejecutado después de cada comprobación de la vista.
  // Si está marcado el flag, desplaza el contenedor de mensajes al final.
  // Se usa para mostrar siempre el último mensaje disponible.
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // Método para volver a la pantalla anterior.
  // Utiliza el historial de navegación del navegador.
  // Se ejecuta desde el botón de volver del chat.
  goBack(): void {
    this.location.back();
  }

  // Método para cargar los mensajes de la conversación actual.
  // Solicita al backend la conversación y sus mensajes asociados.
  // Actualiza la vista y activa el scroll automático al final.
  loadMessages(): void {
    this.isLoading = true;

    this.chatService.getConversationMessages(this.conversationId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.conversation = res.conversation;
          this.messages = res.messages || [];
          this.shouldScrollToBottom = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar mensajes:', err);
        }
      });
  }

  // Método para refrescar las notificaciones del header.
  // Consulta solicitudes pendientes y mensajes no leídos.
  // Actualiza el indicador global si existe alguna notificación pendiente.
  refreshHeaderNotifications(): void {
    forkJoin({
      pending: this.friendsService.getPendingRequests(),
      unread: this.chatService.getUnreadCountsByFriend()
    }).subscribe({
      next: ({ pending, unread }: any) => {
        const pendingCount = pending?.pendingRequests?.length || 0;

        const unreadMap = unread?.unreadMessagesByFriend || {};
        const unreadTotal = Object.values(unreadMap).reduce(
          (sum: number, count: any) => sum + Number(count || 0),
          0
        );

        this.notificationsService.setHasFriendsNotifications(
          pendingCount > 0 || unreadTotal > 0
        );
      },
      error: (err) => {
        console.error('Error al refrescar notificaciones del header:', err);
      }
    });
  }

  // Método para enviar un nuevo mensaje.
  // Inserta primero un mensaje temporal para mejorar la respuesta visual.
  // Si el backend responde correctamente, sustituye el temporal por el real.
  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content) return;

    this.newMessage = '';

    // Mensaje optimista mostrado antes de recibir la respuesta del backend.
    const optimisticMsg = {
      _id: `temp_${Date.now()}`,
      content,
      sender: this.currentUserId,
      createdAt: new Date().toISOString(),
      _optimistic: true
    };
    this.messages = [...this.messages, optimisticMsg];
    this.shouldScrollToBottom = true;
    this.cdr.detectChanges();

    this.chatService.sendMessage(this.conversationId, content).subscribe({
      next: (res) => {
        if (res?.chatMessage) {

          // Sustitución del mensaje temporal por el mensaje confirmado.
          this.messages = this.messages.map(m =>
            m._id === optimisticMsg._id ? res.chatMessage : m
          );
          this.shouldScrollToBottom = true;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al enviar mensaje:', err);

        // Si falla el envío, se elimina el mensaje temporal y se recupera el texto.
        this.messages = this.messages.filter(m => m._id !== optimisticMsg._id);
        this.newMessage = content;
        this.cdr.detectChanges();
      }
    });
  }

  // Método para marcar la conversación como leída.
  // Llama al backend y, si tiene éxito, refresca las notificaciones del header.
  // Permite que desaparezcan avisos de mensajes pendientes.
  markAsRead(): void {
    this.chatService.markConversationAsRead(this.conversationId).subscribe({
      next: () => {
        this.refreshHeaderNotifications();
      },
      error: (err) => {
        console.error('Error al marcar mensajes como leídos:', err);
      }
    });
  }

  // Método para comprobar si un mensaje pertenece al usuario actual.
  // Extrae el identificador del sender aunque venga como objeto o como string.
  // Devuelve true si el emisor coincide con el usuario autenticado.
  isOwnMessage(msg: any): boolean {
    if (!this.currentUserId) return false;
    const senderId = msg?.sender?._id ?? msg?.sender?.id ?? msg?.sender;
    return senderId === this.currentUserId;
  }

  // Método para formatear la hora de un mensaje.
  // Convierte la fecha recibida a formato local de horas y minutos.
  // Si no hay fecha, devuelve una cadena vacía.
  getMessageTime(dateValue: string): string {
    if (!dateValue) return '';
    return new Date(dateValue).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Método privado para desplazar el chat hasta el último mensaje.
  // Accede al contenedor de mensajes y mueve el scroll al final.
  // Se usa tras cargar o enviar mensajes.
  private scrollToBottom(): void {
    if (!this.messagesContainer) return;
    const el = this.messagesContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}