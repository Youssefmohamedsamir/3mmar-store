import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { StoreSettings } from '../models/models';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private get apiUrl(): string {
    return `${getApiBaseUrl()}/settings`;
  }

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

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.loadSettings();
  }

  loadSettings(): void {
    this.http.get<StoreSettings>(this.apiUrl).subscribe({
      next: data => this.settings.set(data),
      error: () => {}
    });
  }

  getSettings(): Observable<StoreSettings> {
    return this.http.get<StoreSettings>(this.apiUrl).pipe(
      tap(data => this.settings.set(data))
    );
  }

  updateSettings(data: StoreSettings): Observable<StoreSettings> {
    return this.http.put<StoreSettings>(this.apiUrl, data, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    }).pipe(
      tap(updated => this.settings.set(updated))
    );
  }
}
