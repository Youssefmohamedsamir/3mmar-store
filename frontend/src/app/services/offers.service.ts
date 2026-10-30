import { Injectable } from '@angular/core';
import { Observable, of, map, tap, catchError } from 'rxjs';
import { Offer } from '../models/models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class OffersService {
  private cachedOffers: Offer[] | null = null;

  constructor(
    private firestore: FirestoreService,
    private auth: AuthService
  ) {
    this.restoreFromLocalCache();
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
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('3mmar_offers_cache');
      }
    } catch {}
  }

  private sanitizeOffer(doc: any): Offer {
    const idNum = typeof doc.id === 'number' ? doc.id : (parseInt(doc.id, 10) || Date.now());
    const images: string[] = Array.isArray(doc.images) ? doc.images : [];
    const primaryImg = doc.imageUrl || (images.length > 0 ? images[0] : 'logo.png');

    return {
      id: idNum,
      title: doc.title || '',
      description: doc.description || '',
      badgeText: doc.badgeText || '',
      imageUrl: primaryImg,
      images: images.length ? images : (doc.imageUrl ? [doc.imageUrl] : []),
      actionUrl: doc.actionUrl || '#products',
      isLimitedTime: !!doc.isLimitedTime,
      isActive: doc.isActive !== false
    };
  }

  getOffers(forceRefresh: boolean = false): Observable<Offer[]> {
    if (!forceRefresh && this.hasCached()) {
      const cached = this.getCached();
      if (cached) return of(cached);
    }

    return this.firestore.getCollection<any>('offers').pipe(
      map(rawDocs => {
        const list = (rawDocs || []).map(d => this.sanitizeOffer(d));
        return list;
      }),
      tap(offers => {
        this.cachedOffers = offers;
        this.setLocalCache(offers);
      }),
      catchError(err => {
        console.error('Firestore getOffers error:', err);
        return of(this.cachedOffers || []);
      })
    );
  }

  getAllOffersAdmin(): Observable<Offer[]> {
    return this.getOffers(true);
  }

  createOffer(offer: Partial<Offer>): Observable<Offer> {
    const id = Date.now();
    const newOffer: Offer = {
      id,
      title: offer.title || '',
      description: offer.description || '',
      badgeText: offer.badgeText || 'عرض خاص',
      imageUrl: offer.imageUrl || (offer.images && offer.images.length ? offer.images[0] : 'logo.png'),
      images: offer.images || [],
      actionUrl: offer.actionUrl || '#products',
      isLimitedTime: offer.isLimitedTime ?? false,
      isActive: offer.isActive ?? true
    };

    return this.firestore.setDocument('offers', String(id), newOffer).pipe(
      map(() => newOffer),
      tap(() => this.clearCache())
    );
  }

  updateOffer(id: number, offer: Partial<Offer>): Observable<Offer> {
    const updated: Offer = {
      ...offer,
      id,
      imageUrl: offer.imageUrl || (offer.images && offer.images.length ? offer.images[0] : 'logo.png'),
      images: offer.images || []
    } as Offer;

    return this.firestore.setDocument('offers', String(id), updated).pipe(
      map(() => updated),
      tap(() => this.clearCache())
    );
  }

  deleteOffer(id: number): Observable<void> {
    return this.firestore.deleteDocument('offers', String(id)).pipe(
      tap(() => this.clearCache())
    );
  }
}
