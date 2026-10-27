import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { CategoryBarComponent } from './components/category-bar/category-bar.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { OffersComponent } from './components/offers/offers.component';
import { MediaComponent } from './components/media/media.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { FooterComponent } from './components/footer/footer.component';
import { AnalyticsService } from './services/analytics.service';
import { SettingsService } from './services/settings.service';
import { ProductService } from './services/product.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    HeroComponent,
    CategoryBarComponent,
    ProductListComponent,
    OffersComponent,
    MediaComponent,
    AuthModalComponent,
    AdminDashboardComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  selectedCategory: string = 'IPhone';
  isAuthModalOpen = false;
  pendingOrderAction: { productId: number; type: 'WhatsApp' | 'Phone' } | null = null;
  activeView: 'store' | 'admin' = 'store';

  constructor(
    private analyticsService: AnalyticsService,
    private settingsService: SettingsService,
    private productService: ProductService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    // Log site visitor in backend
    this.analyticsService.logVisit(window.location.pathname).subscribe();
  }

  handleStart(): void {
    this.activeView = 'store';
    setTimeout(() => {
      const el = document.getElementById('categories');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }

  handleCategoryChange(category: string): void {
    this.selectedCategory = category;
    const el = document.getElementById('products-showcase');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  handleRequireAuth(action: { productId: number; type: 'WhatsApp' | 'Phone' }): void {
    this.pendingOrderAction = action;
    this.isAuthModalOpen = true;
  }

  handleLoginSuccess(action: { productId: number; type: 'WhatsApp' | 'Phone' } | null): void {
    this.isAuthModalOpen = false;
    if (action) {
      // Execute pending order intent
      this.productService.getProductById(action.productId).subscribe({
        next: (product) => {
          this.analyticsService.recordOrderIntent(product.id, action.type).subscribe();
          const currentSettings = this.settingsService.settings();

          if (action.type === 'WhatsApp') {
            const cleanPhone = (currentSettings.whatsApp || '201000000000').replace(/[^0-9]/g, '');
            const user = this.auth.currentUser();
            const clientName = user?.fullName ? ` من العميل: ${user.fullName}` : '';
            const message = `مرحباً متجر عمار، أود طلب المنتج:\n*${product.name}*\nالسعر: ${product.price.toLocaleString()} ج.م\nالقسم: ${product.category}${clientName}`;
            const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
          } else {
            const cleanPhone = (currentSettings.phone || '+201000000000').trim();
            window.location.href = `tel:${cleanPhone}`;
          }
        }
      });
      this.pendingOrderAction = null;
    }
  }

  handleNavigate(sectionId: string): void {
    if (sectionId === 'admin') {
      this.activeView = 'admin';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.activeView = 'store';
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }
}
