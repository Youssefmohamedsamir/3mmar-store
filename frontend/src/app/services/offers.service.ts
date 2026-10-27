import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Offer } from '../models/models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OffersService {
  private readonly apiUrl = 'http://localhost:5000/api/offers';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.auth.getToken()}`
    };
  }

  getOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(this.apiUrl);
  }

  getAllOffersAdmin(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.apiUrl}/all`, {
      headers: this.getAuthHeaders()
    });
  }

  createOffer(offer: Partial<Offer>): Observable<Offer> {
    return this.http.post<Offer>(this.apiUrl, offer, {
      headers: this.getAuthHeaders()
    });
  }

  updateOffer(id: number, offer: Partial<Offer>): Observable<Offer> {
    return this.http.put<Offer>(`${this.apiUrl}/${id}`, offer, {
      headers: this.getAuthHeaders()
    });
  }

  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
