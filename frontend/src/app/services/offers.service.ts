import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { Offer } from '../models/models';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class OffersService {
  private get apiUrl(): string {
    return `${getApiBaseUrl()}/offers`;
  }

  private cachedOffers: Offer[] | null = null;
  private inFlightRequest: Observable<Offer[]> | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.restoreFromLocalCache();
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.auth.getToken()}`
    };
  }

  private restoreFromLocalCache(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const data = localStorage.getItem('3mmar_offers_cache');
      if (data) {
        if (data.includes('عروض التمساح الخاصة')) {
          localStorage.removeItem('3mmar_offers_cache');
          this.cachedOffers = null;
          return;
        }
        this.cachedOffers = JSON.parse(data);
      }
    } catch {}
  }

  private setLocalCache(data: Offer[]): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem('3mmar_offers_cache', JSON.stringify(data));
    } catch {}
  }

  hasCached(): boolean {
    return this.cachedOffers !== null;
  }

  getCached(): Offer[] | null {
    return this.cachedOffers;
  }

  clearCache(): void {
    this.cachedOffers = null;
    this.inFlightRequest = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('3mmar_offers_cache');
      }
    } catch {}
  }

  getOffers(forceRefresh: boolean = false): Observable<Offer[]> {
    if (!forceRefresh && this.cachedOffers !== null) {
      return of(this.cachedOffers);
    }

    if (this.inFlightRequest) {
      return this.inFlightRequest;
    }

    this.inFlightRequest = this.http.get<Offer[]>(this.apiUrl).pipe(
      tap(data => {
        this.cachedOffers = data;
        this.setLocalCache(data);
        this.inFlightRequest = null;
      }),
      shareReplay(1)
    );

    return this.inFlightRequest;
  }

  getAllOffersAdmin(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.apiUrl}/all`, {
      headers: this.getAuthHeaders()
    });
  }

  createOffer(offer: Partial<Offer>): Observable<Offer> {
    return this.http.post<Offer>(this.apiUrl, offer, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.clearCache())
    );
  }

  updateOffer(id: number, offer: Partial<Offer>): Observable<Offer> {
    return this.http.put<Offer>(`${this.apiUrl}/${id}`, offer, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.clearCache())
    );
  }
}
