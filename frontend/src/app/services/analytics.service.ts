import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { AnalyticsSummary, SaleRecord } from '../models/models';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private get apiUrl(): string {
    return `${getApiBaseUrl()}/analytics`;
  }

  private cachedSummary: AnalyticsSummary | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  clearSummaryCache(): void {
    this.cachedSummary = null;
  }

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

  getSummary(forceRefresh: boolean = false): Observable<AnalyticsSummary> {
    if (!forceRefresh && this.cachedSummary) {
      return of(this.cachedSummary);
    }
    return this.http.get<AnalyticsSummary>(`${this.apiUrl}/summary`, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    }).pipe(
      tap(data => this.cachedSummary = data)
    );
  }

  recordSale(sale: any): Observable<SaleRecord> {
    return this.http.post<SaleRecord>(`${this.apiUrl}/sales`, sale, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    });
  }

  deleteSale(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sales/${id}`, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    });
  }
}
