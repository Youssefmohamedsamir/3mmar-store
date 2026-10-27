import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, timeout, catchError, of, throwError } from 'rxjs';
import { User, AuthResponse } from '../models/models';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private get apiUrl(): string {
    return `${getApiBaseUrl()}/auth`;
  }
  private readonly tokenKey = '3mmar_token';
  private readonly userKey = '3mmar_user';

  private userSignal = signal<User | null>(this.getStoredUser());

  currentUser = computed(() => this.userSignal());
  isLoggedIn = computed(() => !!this.userSignal());
  isAdmin = computed(() => this.userSignal()?.role === 'Admin');

  constructor(private http: HttpClient) {
    if (this.getToken()) {
      this.fetchCurrentUser().subscribe({
        error: () => this.logout()
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.userKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(this.tokenKey, res.token);
    const user: User = {
      id: res.userId,
      fullName: res.fullName,
      email: res.email,
      role: res.role,
      provider: res.provider,
      avatarUrl: res.avatarUrl
    };
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.userSignal.set(user);
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      timeout(10000),
      tap(res => this.setSession(res))
    );
  }

  register(data: { fullName: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      timeout(8000),
      tap(res => this.setSession(res))
    );
  }

  socialLogin(data: { provider: 'Google' | 'Facebook'; providerId: string; email: string; fullName: string; avatarUrl?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/social-login`, data).pipe(
      timeout(8000),
      tap(res => this.setSession(res))
    );
  }

  fetchCurrentUser(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    }).pipe(
      timeout(8000),
      tap(res => this.setSession(res))
    );
  }

  changeCredentials(data: { currentPassword: string; newEmail?: string; newPassword?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/change-credentials`, data, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    }).pipe(
      timeout(8000),
      tap(res => this.setSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userSignal.set(null);
  }
}
