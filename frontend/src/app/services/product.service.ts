import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { Product } from '../models/models';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './api-config';

// Instant Offline/Initial Seed Data (Eliminates Initial Fetch Latency on Mobile)
export const INITIAL_PRODUCTS_SEED: Product[] = [
  {
    id: 4,
    name: "iPhone 16 Pro Max",
    category: "IPhone",
    description: "النسخة الأصلية بسعة 256 جيجابايت مع الضمان والملحقات الأصلية",
    price: 55000,
    oldPrice: undefined,
    quantity: 3,
    imageUrl: "logo.png",
    images: ["logo.png"],
    isAvailable: true,
    isFeatured: true,
    createdAt: "2026-10-30T09:31:04.4033333"
  },
  {
    id: 5,
    name: "Samsung Galaxy S24 Ultra",
    category: "Android",
    description: "أحدث أجهزة سامسونج الفلاج شيب مع قلم S-Pen وكاميرا 200 ميجابكسل",
    price: 49000,
    oldPrice: undefined,
    quantity: 2,
    imageUrl: "logo.png",
    images: ["logo.png"],
    isAvailable: true,
    isFeatured: true,
    createdAt: "2026-10-30T09:31:04.5"
  }
];

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private get apiUrl(): string {
    return `${getApiBaseUrl()}/products`;
  }

  // In-Memory RAM Cache Map: key => Product[]
  private ramCache = new Map<string, Product[]>();
  private allProductsCached: Product[] | null = null;
  private inFlightRequest: Observable<Product[]> | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.initializeCacheFromStorageOrSeed();
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.auth.getToken()}`
    };
  }

  private initializeCacheFromStorageOrSeed(): void {
    // 1. Try restoring from localStorage
    const storedAll = this.getLocalCache('All');
    if (storedAll && storedAll.length > 0) {
      this.allProductsCached = storedAll;
      this.ramCache.set('All', storedAll);
      this.populateCategoryCaches(storedAll);
      return;
    }

    // 2. Fallback to Initial Seed for true 0ms first paint
    this.allProductsCached = INITIAL_PRODUCTS_SEED;
    this.ramCache.set('All', INITIAL_PRODUCTS_SEED);
    this.setLocalCache('All', INITIAL_PRODUCTS_SEED);
    this.populateCategoryCaches(INITIAL_PRODUCTS_SEED);
  }

  private populateCategoryCaches(all: Product[]): void {
    for (const cat of ['IPhone', 'Android', 'Accessories', 'Other']) {
      const filtered = all.filter(p => p.category?.toLowerCase() === cat.toLowerCase());
      this.ramCache.set(cat, filtered);
      this.setLocalCache(cat, filtered);
    }
  }

  private getLocalCache(key: string): Product[] | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const data = localStorage.getItem(`3mmar_cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private setLocalCache(key: string, data: Product[]): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(`3mmar_cache_${key}`, JSON.stringify(data));
    } catch {
      // Safe fallback if quota exceeded
    }
  }

  hasCached(category?: string): boolean {
    const key = category || 'All';
    if (this.ramCache.has(key)) return true;
    if (this.allProductsCached !== null) return true;
    return !!this.getLocalCache(key);
  }

  getCached(category?: string): Product[] | null {
    const key = category || 'All';
    if (this.ramCache.has(key)) {
      return this.ramCache.get(key)!;
    }

    if (this.allProductsCached !== null) {
      if (!category || category === 'All') {
        return this.allProductsCached;
      }
      const filtered = this.allProductsCached.filter(p => p.category?.toLowerCase() === category.toLowerCase());
      this.ramCache.set(key, filtered);
      return filtered;
    }

    const local = this.getLocalCache(key);
    if (local) {
      this.ramCache.set(key, local);
      return local;
    }
    return null;
  }

  clearCache(): void {
    this.ramCache.clear();
    this.allProductsCached = null;
    this.inFlightRequest = null;
    try {
      for (const cat of ['All', 'IPhone', 'Android', 'Accessories', 'Other']) {
        localStorage.removeItem(`3mmar_cache_${cat}`);
      }
    } catch {}
  }

  getProducts(category?: string, search?: string, forceRefresh: boolean = false): Observable<Product[]> {
    const cacheKey = category || 'All';

    // If searching, always query fresh
    if (search && search.trim()) {
      let params = new HttpParams().set('search', search.trim());
      if (category && category !== 'All') {
        params = params.set('category', category);
      }
      return this.http.get<Product[]>(this.apiUrl, { params });
    }

    // Return instant RAM cache if available and not forcing refresh
    if (!forceRefresh && this.hasCached(category)) {
      const cached = this.getCached(category);
      if (cached) {
        return of(cached);
      }
    }

    // Deduplicate in-flight requests for 'All' products
    if (!category || category === 'All') {
      if (this.inFlightRequest) {
        return this.inFlightRequest;
      }

      this.inFlightRequest = this.http.get<Product[]>(this.apiUrl).pipe(
        tap((data) => {
          this.allProductsCached = data;
          this.ramCache.set('All', data);
          this.setLocalCache('All', data);
          this.populateCategoryCaches(data);
          this.inFlightRequest = null;
        }),
        shareReplay(1)
      );

      return this.inFlightRequest;
    }

    // For specific category: check if we can resolve from allProductsCached in memory
    if (this.allProductsCached !== null && !forceRefresh) {
      const filtered = this.allProductsCached.filter(p => p.category?.toLowerCase() === category.toLowerCase());
      this.ramCache.set(cacheKey, filtered);
      this.setLocalCache(cacheKey, filtered);
      return of(filtered);
    }

    let params = new HttpParams();
    if (category && category !== 'All') {
      params = params.set('category', category);
    }

    return this.http.get<Product[]>(this.apiUrl, { params }).pipe(
      tap((data) => {
        this.ramCache.set(cacheKey, data);
        this.setLocalCache(cacheKey, data);
      })
    );
  }

  getProductById(id: number): Observable<Product> {
    if (this.allProductsCached) {
      const p = this.allProductsCached.find(x => x.id === id);
      if (p) return of(p);
    }
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.clearCache())
    );
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => this.clearCache())
    );
  }
}
