import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private apiUrl = 'http://localhost:3001/api/events';

  constructor(private http: HttpClient) {}

  getEvents(page = 1, limit = 12, filters: any = {}): Observable<any> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (filters.category) params = params.set('category', filters.category);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);

    return this.http.get(this.apiUrl, { params });
  }

  getEventById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getGlobalStats(): Observable<any> {
    return this.http.get('http://localhost:3001/api/stats/global');
  }

  getPersonalStats(): Observable<any> {
    return this.http.get('http://localhost:3001/api/stats/personal', { withCredentials: true });
  }

  toggleAttend(eventId: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${eventId}/attend`, 
      {},
      { withCredentials: true } 
    );
  }
}