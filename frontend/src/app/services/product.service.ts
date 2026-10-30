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
  // In-Memory RAM Cache Map: key => Product[]
  private ramCache = new Map<string, Product[]>();
  private allProductsCached: Product[] | null = null;

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

    let params = new HttpParams();
    if (category && category !== 'All') {
      params = params.set('category', category);
    }

    return this.http.get<Product[]>(this.apiUrl, { params }).pipe(
      tap((data) => {
        this.ramCache.set(cacheKey, data);
        this.setLocalCache(cacheKey, data);
        if (!category || category === 'All') {
          this.allProductsCached = data;
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
