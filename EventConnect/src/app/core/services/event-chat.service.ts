import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventChatService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/event-chat';

  getMessages(eventId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${eventId}/messages`);
  }

  sendMessage(eventId: string, content: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${eventId}/messages`,
      { content },
      { withCredentials: true }
    );
  }

  getFriendsAttending(eventId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/${eventId}/friends`,
      { withCredentials: true }
    );
  }
}