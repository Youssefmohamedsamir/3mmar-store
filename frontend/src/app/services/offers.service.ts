import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
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

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.auth.getToken()}`
    };
  }

  clearCache(): void {
    this.cachedOffers = null;
  }

  getOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(this.apiUrl).pipe(
      tap(data => this.cachedOffers = data)
    );
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
