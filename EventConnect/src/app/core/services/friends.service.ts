import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private httpBackend = inject(HttpBackend);
  private http = new HttpClient(this.httpBackend);
  private apiUrl = `${environment.apiUrl}/friends`;

  sendFriendRequest(friendId: string) {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/request`,
      { friendId },
      { withCredentials: true }
    );
  }

  acceptFriendRequest(requestId: string) {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/accept`,
      { requestId },
      { withCredentials: true }
    );
  }

  rejectFriendRequest(requestId: string) {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/reject`,
      { requestId },
      { withCredentials: true }
    );
  }

  getPendingRequests() {
    return this.http.get<{ pendingRequests: any[] }>(
      `${this.apiUrl}/pending`,
      { withCredentials: true }
    );
  }

  getFriends() {
    return this.http.get<{ friends: any[], count: number }>(
      `${this.apiUrl}/list`,
      { withCredentials: true }
    );
  }

  removeFriend(friendId: string) {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/remove`,
      { friendId },
      { withCredentials: true }
    );
  }

  getAllUsers() {
    return this.http.get<{ users: any[] }>(
      `${this.apiUrl}/searchable`,
      { withCredentials: true }
    );
  }

  getSuggestedFriends() {
    return this.http.get<{ suggestedFriends: any[] }>(
      `${this.apiUrl}/suggested`,
      { withCredentials: true }
    );
  }

  searchUsers(query: string) {
    return this.http.get<{ users: any[] }>(
      `${this.apiUrl}/search?q=${encodeURIComponent(query)}`,
      { withCredentials: true }
    );
  }
}