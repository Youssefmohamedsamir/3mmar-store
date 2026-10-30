import { Injectable } from '@angular/core';
import { Observable, of, map, tap, catchError } from 'rxjs';
import { Product } from '../models/models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // In-Memory RAM Cache Map: key => Product[]
  private ramCache = new Map<string, Product[]>();
  private allProductsCached: Product[] | null = null;
  private inFlightRequest: Observable<Product[]> | null = null;

  constructor(
    private firestore: FirestoreService,
    private auth: AuthService
  ) {
    this.cleanLegacyDummyCache();
    this.restoreRealCacheFromStorage();
  }

  private cleanLegacyDummyCache(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const allCachedStr = localStorage.getItem('3mmar_cache_All');
      if (allCachedStr && (allCachedStr.includes('iPhone 16 Pro Max') || allCachedStr.includes('Samsung Galaxy S24 Ultra') || allCachedStr.includes('55000'))) {
        for (const cat of ['All', 'IPhone', 'Android', 'Accessories', 'Other']) {
          localStorage.removeItem(`3mmar_cache_${cat}`);
        }
      }
    } catch {}
  }

  private restoreRealCacheFromStorage(): void {
    const storedAll = this.getLocalCache('All');
    if (storedAll && Array.isArray(storedAll) && storedAll.length > 0) {
      const isClean = !storedAll.some(p => p.name?.includes('iPhone 16 Pro Max') || p.name?.includes('Samsung Galaxy S24 Ultra'));
      if (isClean) {
        this.allProductsCached = storedAll;
        this.ramCache.set('All', storedAll);
        this.populateCategoryCaches(storedAll);
      } else {
        this.clearCache();
      }
    }
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
    } catch {}
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
      if (typeof window !== 'undefined' && window.localStorage) {
        for (const cat of ['All', 'IPhone', 'Android', 'Accessories', 'Other']) {
          localStorage.removeItem(`3mmar_cache_${cat}`);
        }
      }
    } catch {}
  }

  private sanitizeProduct(doc: any): Product {
    const idNum = typeof doc.id === 'number' ? doc.id : (parseInt(doc.id, 10) || Date.now());
    const images: string[] = Array.isArray(doc.images) ? doc.images : [];
    const primaryImg = doc.imageUrl || (images.length > 0 ? images[0] : 'logo.png');

    return {
      id: idNum,
      name: doc.name || '',
      category: doc.category || 'Other',
      description: doc.description || '',
      price: Number(doc.price) || 0,
      oldPrice: doc.oldPrice !== undefined && doc.oldPrice !== null ? Number(doc.oldPrice) : undefined,
      quantity: doc.quantity !== undefined ? Number(doc.quantity) : 1,
      imageUrl: primaryImg,
      images: images.length ? images : (doc.imageUrl ? [doc.imageUrl] : []),
      isAvailable: doc.isAvailable !== false,
      isFeatured: !!doc.isFeatured,
      createdAt: doc.createdAt || new Date().toISOString()
    };
  }

  getProducts(category?: string, search?: string, forceRefresh: boolean = false): Observable<Product[]> {
    const cacheKey = category || 'All';

    // Instant RAM cache when available and not forcing refresh
    if (!forceRefresh && !search && this.hasCached(category)) {
      const cached = this.getCached(category);
      if (cached) {
        return of(cached);
      }
    }

    return this.firestore.getCollection<any>('products').pipe(
      map(rawDocs => {
        let list: Product[] = (rawDocs || []).map(d => this.sanitizeProduct(d));

        // Filter by category
        if (category && category !== 'All') {
          list = list.filter(p => p.category?.toLowerCase() === category.toLowerCase());
        }

        // Filter by search query
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          list = list.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
          );
        }

        // Sort: Featured first, then newest
        list.sort((a, b) => {
          if (b.isFeatured !== a.isFeatured) {
            return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return list;
      }),
      tap(products => {
        if (!search || !search.trim()) {
          if (!category || category === 'All') {
            this.allProductsCached = products;
            this.ramCache.set('All', products);
            this.setLocalCache('All', products);
            this.populateCategoryCaches(products);
          } else {
            this.ramCache.set(cacheKey, products);
            this.setLocalCache(cacheKey, products);
          }
        }
      }),
      catchError(err => {
        console.error('Firestore getProducts error:', err);
        const cached = this.getCached(category);
        return of(cached || []);
      })
    );
  }

  getProductById(id: number): Observable<Product | null> {
    if (this.allProductsCached) {
      const p = this.allProductsCached.find(x => x.id === id);
      if (p) return of(p);
    }
    return this.firestore.getDocument<any>('products', String(id)).pipe(
      map(doc => doc ? this.sanitizeProduct(doc) : null)
    );
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    const id = Date.now();
    const newProduct: Product = {
      id,
      name: product.name || '',
      category: product.category || 'IPhone',
      description: product.description || '',
      price: product.price || 0,
      oldPrice: product.oldPrice,
      quantity: product.quantity !== undefined ? product.quantity : 1,
      imageUrl: product.imageUrl || (product.images && product.images.length ? product.images[0] : 'logo.png'),
      images: product.images || [],
      isAvailable: product.isAvailable ?? true,
      isFeatured: product.isFeatured ?? false,
      createdAt: new Date().toISOString()
    };

    return this.firestore.setDocument('products', String(id), newProduct).pipe(
      map(() => newProduct),
      tap(() => this.clearCache())
    );
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    const updated: Product = {
      ...product,
      id,
      imageUrl: product.imageUrl || (product.images && product.images.length ? product.images[0] : 'logo.png'),
      images: product.images || []
    } as Product;

    return this.firestore.setDocument('products', String(id), updated).pipe(
      map(() => updated),
      tap(() => this.clearCache())
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.firestore.deleteDocument('products', String(id)).pipe(
      tap(() => this.clearCache())
    );
  }
}
