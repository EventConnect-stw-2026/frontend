import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../layout/components/header/header';

@Component({
  standalone: true,
  selector: 'app-chat-detail',
  templateUrl: './chat-detail.component.html',
  styleUrl: './chat-detail.component.scss',
  imports: [CommonModule, FormsModule, HeaderComponent]
})
export class ChatDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  conversationId = '';
  conversation: any = null;
  messages: any[] = [];
  newMessage = '';
  currentUserId = '';

  isLoading = false;
  isSending = false;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser() as any;
    this.currentUserId = user?._id || '';

    this.conversationId = this.route.snapshot.paramMap.get('conversationId') || '';

    if (this.conversationId) {
      this.loadMessages();
      this.markAsRead();
    }
  }

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
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar mensajes:', err);
        }
      });
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content) return;

    // limpiar el input al instante
    this.newMessage = '';
    this.cdr.detectChanges();

    this.chatService.sendMessage(this.conversationId, content).subscribe({
      next: (res) => {
        if (res?.chatMessage) {
          this.messages = [...this.messages, res.chatMessage];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al enviar mensaje:', err);

        // opcional: devolver el texto al input si falla
        this.newMessage = content;
        this.cdr.detectChanges();
      }
    });
  }

  markAsRead(): void {
    this.chatService.markConversationAsRead(this.conversationId).subscribe({
      error: (err) => {
        console.error('Error al marcar como leído:', err);
      }
    });
  }

  isOwnMessage(msg: any): boolean {
    return msg?.sender?._id === this.currentUserId || msg?.sender === this.currentUserId;
  }
}