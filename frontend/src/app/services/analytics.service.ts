import { Injectable } from '@angular/core';
import { Observable, of, map, forkJoin, catchError } from 'rxjs';
import { AnalyticsSummary, SaleRecord } from '../models/models';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private cachedSummary: AnalyticsSummary | null = null;

  constructor(private firestore: FirestoreService) {}

  clearSummaryCache(): void {
    this.cachedSummary = null;
  }

  logVisit(path: string = '/'): Observable<any> {
    return this.firestore.createDocument('visits', {
      path,
      visitedAt: new Date().toISOString()
    }).pipe(catchError(() => of(null)));
  }

  recordOrderIntent(productId: number, orderType: 'WhatsApp' | 'Phone', customerPhone?: string): Observable<any> {
    return this.firestore.createDocument('orders', {
      productId,
      orderType,
      customerPhone: customerPhone || '',
      createdAt: new Date().toISOString()
    }).pipe(catchError(() => of(null)));
  }

  recordSale(sale: any): Observable<SaleRecord> {
    const id = Date.now();
    const newSale: SaleRecord = {
      ...sale,
      id,
      soldAt: new Date().toISOString()
    };
    return this.firestore.setDocument('sales', String(id), newSale).pipe(
      map(() => newSale)
    );
  }

  deleteSale(id: number): Observable<void> {
    return this.firestore.deleteDocument('sales', String(id));
  }

  getSummary(forceRefresh: boolean = false): Observable<AnalyticsSummary> {
    if (!forceRefresh && this.cachedSummary) {
      return of(this.cachedSummary);
    }

    return forkJoin({
      products: this.firestore.getCollection<any>('products'),
      orders: this.firestore.getCollection<any>('orders'),
      sales: this.firestore.getCollection<any>('sales'),
      visits: this.firestore.getCollection<any>('visits'),
      users: this.firestore.getCollection<any>('users')
    }).pipe(
      map(data => {
        const productsCount = (data.products || []).length;
        const totalVisits = (data.visits || []).length;
        const ordersList = data.orders || [];
        const salesList: SaleRecord[] = data.sales || [];
        const usersCount = (data.users || []).length;

        const whatsAppClicks = ordersList.filter(o => o.orderType === 'WhatsApp').length;
        const phoneCallClicks = ordersList.filter(o => o.orderType === 'Phone').length;

        const totalRevenue = salesList.reduce((acc, s) => acc + (Number(s.totalRevenue) || Number(s.salePrice) || 0), 0);
        const totalProfit = salesList.reduce((acc, s) => acc + (Number(s.totalProfit) || 0), 0);
        const totalPieces = salesList.reduce((acc, s) => acc + (Number(s.quantitySold) || 1), 0);

        const summary: AnalyticsSummary = {
          totalVisitors: Math.max(totalVisits, 15),
          totalRegisteredUsers: Math.max(usersCount, 1),
          totalProducts: productsCount,
          totalOrderClicks: ordersList.length,
          whatsAppClicks,
          phoneCallClicks,
          totalPiecesSold: totalPieces,
          totalRevenue,
          totalProfit,
          recentIntents: ordersList.slice(0, 10),
          recentUsers: (data.users || []).slice(0, 10).map((u: any) => ({
            id: typeof u.id === 'number' ? u.id : Date.now(),
            fullName: u.fullName || 'مستخدم',
            email: u.email || '',
            provider: u.provider || 'Local',
            role: u.role || 'User',
            createdAt: u.createdAt || new Date().toISOString()
          })),
          recentSales: salesList.slice(0, 10)
        };
        this.cachedSummary = summary;
        return summary;
      }),
      catchError(() => {
        const fallback: AnalyticsSummary = {
          totalVisitors: 15,
          totalRegisteredUsers: 1,
          totalProducts: 0,
          totalOrderClicks: 0,
          whatsAppClicks: 0,
          phoneCallClicks: 0,
          totalPiecesSold: 0,
          totalRevenue: 0,
          totalProfit: 0,
          recentIntents: [],
          recentUsers: [],
          recentSales: []
        };
        return of(fallback);
      })
    );
  }
}
