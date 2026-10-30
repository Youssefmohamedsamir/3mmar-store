import { Injectable, signal } from '@angular/core';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { StoreSettings } from '../models/models';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  settings = signal<StoreSettings>({
    storeName: '3mmar Store',
    phone: '01044858440',
    whatsApp: '01044858440',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    tiktokUrl: 'https://tiktok.com',
    welcomeMessage: 'مرحباً بكم في 3mmar Store',
    address: 'مدينة السادات'
  });

  constructor(private firestore: FirestoreService) {
    this.loadSettings();
  }

  loadSettings(): void {
    this.firestore.getDocument<StoreSettings>('settings', 'store').subscribe({
      next: data => {
        if (data) {
          this.settings.set({ ...this.settings(), ...data });
        }
      },
      error: () => {}
    });
  }

  getSettings(): Observable<StoreSettings> {
    return this.firestore.getDocument<StoreSettings>('settings', 'store').pipe(
      map(data => data ? { ...this.settings(), ...data } : this.settings()),
      tap(data => this.settings.set(data))
    );
  }

  updateSettings(data: StoreSettings): Observable<StoreSettings> {
    return this.firestore.setDocument('settings', 'store', data).pipe(
      map(() => data),
      tap(updated => this.settings.set(updated))
    );
  }
}
