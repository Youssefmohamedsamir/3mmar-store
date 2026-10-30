import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { CategoryBarComponent } from './components/category-bar/category-bar.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { OffersComponent } from './components/offers/offers.component';
import { MediaComponent } from './components/media/media.component';
import { FooterComponent } from './components/footer/footer.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AnalyticsService } from './services/analytics.service';
import { SettingsService } from './services/settings.service';
import { ProductService } from './services/product.service';
import { OffersService } from './services/offers.service';
import { AuthService } from './services/auth.service';
import { PwaService } from './services/pwa.service';
import { ToastService } from './services/toast.service';
import { Product } from './models/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    HeroComponent,
    CategoryBarComponent,
    ProductListComponent,
    ProductDetailComponent,
    OffersComponent,
    MediaComponent,
    FooterComponent,
    AuthModalComponent,
    AdminDashboardComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  selectedCategory: string = 'IPhone';
  isAuthModalOpen = false;
  pendingOrderAction: { productId: number; type: 'WhatsApp' | 'Phone' } | null = null;
  activeView: 'home' | 'admin' | 'product-detail' = 'home';
  selectedProduct: Product | null = null;
  allProductsList: Product[] = [];

  categoryTabs = [
    { id: 'IPhone', name: 'أجهزة iPhone', subtitle: 'Apple' },
    { id: 'Android', name: 'أجهزة Android', subtitle: 'Samsung & Xiaomi' },
    { id: 'Accessories', name: 'إكسسوارات', subtitle: 'Original Gear' },
    { id: 'Other', name: 'أجهزة أخرى', subtitle: 'Smart Tech' }
  ];

  constructor(
    private analyticsService: AnalyticsService,
    private settingsService: SettingsService,
    private productService: ProductService,
    private offersService: OffersService,
    public auth: AuthService,
    public pwa: PwaService,
    public toast: ToastService
  ) {}

  ngOnInit(): void {
    // Log site visitor in backend asynchronously
    this.analyticsService.logVisit(window.location.pathname).subscribe({ error: () => {} });
    
    // Warm up RAM Cache immediately on startup for all products and offers
    this.preloadStoreData();
  }

  preloadStoreData(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.allProductsList = data;
      },
      error: () => {}
    });

    this.offersService.getOffers().subscribe({
      error: () => {}
    });
  }

  handleViewProduct(product: Product): void {
    this.selectedProduct = product;
    this.activeView = 'product-detail';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleBackFromDetail(): void {
    this.activeView = 'home';
    setTimeout(() => {
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  handleStart(): void {
    this.activeView = 'home';
    const el = document.getElementById('offers');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  }

  handleCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.activeView = 'home';
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  switchCategory(category: string): void {
    this.selectedCategory = category;
  }

  handleRequireAuth(action: { productId: number; type: 'WhatsApp' | 'Phone' }): void {
    this.pendingOrderAction = action;
    this.isAuthModalOpen = true;
  }

  handleLoginSuccess(action: { productId: number; type: 'WhatsApp' | 'Phone' } | null): void {
    this.isAuthModalOpen = false;
    
    // If the logged in user is the Admin, navigate directly to Admin Dashboard
    if (this.auth.isAdmin()) {
      this.activeView = 'admin';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (action) {
      // Execute pending order intent
      this.productService.getProductById(action.productId).subscribe({
        next: (product) => {
          this.analyticsService.recordOrderIntent(product.id, action.type).subscribe();
          const currentSettings = this.settingsService.settings();

          if (action.type === 'WhatsApp') {
            const cleanPhone = (currentSettings.whatsApp || '01044858440').replace(/[^0-9]/g, '');
            const user = this.auth.currentUser();
            const clientName = user?.fullName ? ` من العميل: ${user.fullName}` : '';
            const message = `مرحباً متجر عمار، أود طلب المنتج:\n*${product.name}*\nالسعر: ${product.price.toLocaleString()} ج.م\nالقسم: ${product.category}${clientName}`;
            const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
          } else {
            const cleanPhone = (currentSettings.phone || '01044858440').trim();
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

    if (sectionId === 'categories' || sectionId === 'products') {
      this.activeView = 'home';
      setTimeout(() => {
        const targetId = sectionId === 'products' ? 'products-section' : 'categories';
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    if (sectionId === 'hero' || sectionId === 'home') {
      this.activeView = 'home';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Otherwise offers or media
    this.activeView = 'home';
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
