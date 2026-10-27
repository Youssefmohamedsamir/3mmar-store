import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Product } from '../models/models';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private get apiUrl(): string {
    return `${getApiBaseUrl()}/products`;
  }
  private cache = new Map<string, Product[]>();

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.auth.getToken()}`
    };
  }

  private getLocalCache(key: string): Product[] | null {
    try {
      const data = localStorage.getItem(`3mmar_cache_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private setLocalCache(key: string, data: Product[]): void {
    try {
      // Keep only essential fields to prevent quota issues
      const cleanData = data.slice(0, 50).map(p => ({
        ...p,
        // if base64 images are very huge, truncate non-primary images for localStorage
        images: (p.images || [p.imageUrl]).slice(0, 3)
      }));
      localStorage.setItem(`3mmar_cache_${key}`, JSON.stringify(cleanData));
    } catch {
      // Quota exceeded safe fallback
    }
  }

  hasCached(category?: string): boolean {
    const key = category || 'All';
    return this.cache.has(key) || !!this.getLocalCache(key);
  }

  getCached(category?: string): Product[] | null {
    const key = category || 'All';
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    const local = this.getLocalCache(key);
    if (local) {
      this.cache.set(key, local);
      return local;
    }
    return null;
  }

  clearCache(): void {
    this.cache.clear();
    try {
      for (const cat of ['All', 'IPhone', 'Android', 'Accessories', 'Other']) {
        localStorage.removeItem(`3mmar_cache_${cat}`);
      }
    } catch {}
  }

  getProducts(category?: string, search?: string, forceRefresh: boolean = false): Observable<Product[]> {
    const cacheKey = category || 'All';
    
    // Return cached data immediately if available and no search
    if (!search && !forceRefresh) {
      const cached = this.getCached(cacheKey);
      if (cached && cached.length > 0) {
        return of(cached);
      }
    }

    let params = new HttpParams();
    if (category && category !== 'All') {
      params = params.set('category', category);
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Product[]>(this.apiUrl, { params }).pipe(
      tap((data) => {
        if (!search) {
          this.cache.set(cacheKey, data);
          this.setLocalCache(cacheKey, data);
        }
      })
    );
  }

  getProductById(id: number): Observable<Product> {
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
