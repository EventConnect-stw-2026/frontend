import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MeetupService {
  private httpBackend = inject(HttpBackend);
  private http = new HttpClient(this.httpBackend);
  private apiUrl = `${environment.apiUrl}/meetups`;

  createMeetup(payload: {
    eventId: string;
    friendIds: string[];
    meetupDateTime: string;
    meetupPlace: string;
  }) {
    return this.http.post<{ message: string; meetup: any }>(
      this.apiUrl,
      payload,
      { withCredentials: true }
    );
  }

  getOrganizedMeetups() {
    return this.http.get<{ meetups: any[] }>(
      `${this.apiUrl}/organized`,
      { withCredentials: true }
    );
  }

  getInvitedMeetups() {
    return this.http.get<{ meetups: any[] }>(
      `${this.apiUrl}/invited`,
      { withCredentials: true }
    );
  }

  respondToMeetup(meetupId: string, response: 'accepted' | 'rejected') {
    return this.http.put<{ message: string; meetup: any }>(
      `${this.apiUrl}/${meetupId}/respond`,
      { response },
      { withCredentials: true }
    );
  }

  cancelMeetup(meetupId: string) {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/${meetupId}/cancel`,
      {},
      { withCredentials: true }
    );
  }
}