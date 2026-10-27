import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalyticsSummary } from '../models/models';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private get apiUrl(): string {
    return `${getApiBaseUrl()}/analytics`;
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  logVisit(path: string = '/'): Observable<any> {
    return this.http.post(`${this.apiUrl}/visit`, { path });
  }

  recordOrderIntent(productId: number, orderType: 'WhatsApp' | 'Phone', customerPhone?: string): Observable<any> {
    const headers: { [key: string]: string } = {};
    const token = this.auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.http.post(`${this.apiUrl}/order-intent`, { productId, orderType, customerPhone }, { headers });
  }

  getSummary(): Observable<AnalyticsSummary> {
    return this.http.get<AnalyticsSummary>(`${this.apiUrl}/summary`, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    });
  }
}
