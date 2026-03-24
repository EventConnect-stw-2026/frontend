import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private httpBackend = inject(HttpBackend);
  private http = new HttpClient(this.httpBackend);
  private baseUrl = `${environment.apiUrl}/chat`;

  createOrGetConversation(friendId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/conversations/${friendId}`,
      {},
      { withCredentials: true }
    );
  }

  getMyConversations(): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/conversations`,
      { withCredentials: true }
    );
  }

  getConversationMessages(conversationId: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { withCredentials: true }
    );
  }

  sendMessage(conversationId: string, content: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { content },
      { withCredentials: true }
    );
  }

  markConversationAsRead(conversationId: string): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}/conversations/${conversationId}/read`,
      {},
      { withCredentials: true }
    );
  }
}