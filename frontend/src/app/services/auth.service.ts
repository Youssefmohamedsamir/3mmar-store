import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap, map, catchError, of, throwError } from 'rxjs';
import { User, AuthResponse } from '../models/models';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = '3mmar_token';
  private readonly userKey = '3mmar_user';

  private userSignal = signal<User | null>(this.getStoredUser());

  currentUser = computed(() => this.userSignal());
  isLoggedIn = computed(() => !!this.userSignal());
  isAdmin = computed(() => this.userSignal()?.role === 'Admin');

  constructor(private firestore: FirestoreService) {}

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getStoredUser(): User | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
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
    const emailNorm = (credentials.email || '').trim().toLowerCase();
    const pass = credentials.password || '';

    // Primary Admin Hardcoded Master Access + Cloud Backup Check
    if (emailNorm === 'amary212005@gmail.com' && pass === '123456789') {
      const adminRes: AuthResponse = {
        token: `token_admin_${Date.now()}`,
        userId: 1,
        fullName: 'عمار (Admin)',
        email: 'amary212005@gmail.com',
        role: 'Admin',
        provider: 'Local',
        avatarUrl: ''
      };
      this.setSession(adminRes);
      return of(adminRes);
    }

    // Check Cloud Firestore Registered Users
    return this.firestore.getCollection<any>('users').pipe(
      map(users => {
        const found = users.find(u => (u.email || '').toLowerCase() === emailNorm);
        if (!found) {
          throw new Error('هذا البريد الإلكتروني ليس له حساب مسبق في متجرنا. يرجى إنشاء حساب جديد أولاً.');
        }
        if (found.password !== pass) {
          throw new Error('كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.');
        }

        const res: AuthResponse = {
          token: `token_user_${Date.now()}`,
          userId: typeof found.id === 'number' ? found.id : Date.now(),
          fullName: found.fullName || 'عميل المتجر',
          email: found.email,
          role: found.role || 'User',
          provider: found.provider || 'Local',
          avatarUrl: found.avatarUrl || ''
        };
        this.setSession(res);
        return res;
      })
    );
  }

  register(data: { fullName: string; email: string; password: string }): Observable<AuthResponse> {
    const emailNorm = (data.email || '').trim().toLowerCase();
    const userId = Date.now();
    const userDoc = {
      id: userId,
      fullName: data.fullName.trim(),
      email: emailNorm,
      password: data.password,
      role: 'User',
      provider: 'Local',
      createdAt: new Date().toISOString()
    };

    return this.firestore.setDocument('users', `user_${userId}`, userDoc).pipe(
      map(() => {
        const res: AuthResponse = {
          token: `token_user_${userId}`,
          userId,
          fullName: userDoc.fullName,
          email: emailNorm,
          role: 'User',
          provider: 'Local'
        };
        this.setSession(res);
        return res;
      })
    );
  }

  socialLogin(data: { provider: 'Google' | 'Facebook'; providerId: string; email: string; fullName: string; avatarUrl?: string }): Observable<AuthResponse> {
    const emailNorm = (data.email || '').trim().toLowerCase();
    const userId = Date.now();
    const userDoc = {
      id: userId,
      fullName: data.fullName || (data.provider === 'Google' ? 'عميل جوجل' : 'عميل فيسبوك'),
      email: emailNorm,
      provider: data.provider,
      providerId: data.providerId,
      avatarUrl: data.avatarUrl || '',
      role: 'User',
      createdAt: new Date().toISOString()
    };

    return this.firestore.setDocument('users', `social_${data.provider.toLowerCase()}_${userId}`, userDoc).pipe(
      map(() => {
        const res: AuthResponse = {
          token: `token_social_${userId}`,
          userId,
          fullName: userDoc.fullName,
          email: emailNorm,
          role: 'User',
          provider: data.provider,
          avatarUrl: data.avatarUrl
        };
        this.setSession(res);
        return res;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userSignal.set(null);
  }

  fetchCurrentUser(): Observable<AuthResponse> {
    const user = this.getStoredUser();
    if (!user) {
      return throwError(() => new Error('Not logged in'));
    }
    const res: AuthResponse = {
      token: this.getToken() || `token_${Date.now()}`,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      provider: user.provider,
      avatarUrl: user.avatarUrl
    };
    return of(res);
  }

  changeCredentials(data: { currentPassword: string; newEmail?: string; newPassword?: string }): Observable<AuthResponse> {
    const cur = this.userSignal();
    if (!cur) return throwError(() => new Error('Not logged in'));

    const updatedUser: User = {
      ...cur,
      email: data.newEmail ? data.newEmail.trim().toLowerCase() : cur.email
    };

    return of({
      token: this.getToken() || '',
      userId: cur.id,
      fullName: cur.fullName,
      email: updatedUser.email,
      role: cur.role,
      provider: cur.provider
    }).pipe(
      tap(res => this.setSession(res))
    );
  }
}
