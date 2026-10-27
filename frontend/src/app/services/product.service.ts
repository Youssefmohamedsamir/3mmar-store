import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Product } from '../models/models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = 'http://localhost:5000/api/products';
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

  hasCached(category?: string): boolean {
    return this.cache.has(category || 'All');
  }

  getCached(category?: string): Product[] | null {
    return this.cache.get(category || 'All') || null;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getProducts(category?: string, search?: string, forceRefresh: boolean = false): Observable<Product[]> {
    const cacheKey = category || 'All';
    // If we have cached results and no active search query, return instantly
    if (!search && !forceRefresh && this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey)!);
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
