import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsSummary, Product, StoreSettings, Offer } from '../../models/models';
import { AnalyticsService } from '../../services/analytics.service';
import { ProductService } from '../../services/product.service';
import { SettingsService } from '../../services/settings.service';
import { OffersService } from '../../services/offers.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'analytics' | 'products' | 'offers' | 'settings' | 'account' = 'analytics';

  // Account management fields
  currentPassword = '';
  newEmail = '';
  newPassword = '';
  confirmPassword = '';
  accountMsg = '';
  accountError = '';
  updatingAccount = false;

  // Analytics
  summary: AnalyticsSummary | null = null;
  loadingSummary = false;

  // Products
  products: Product[] = [];
  loadingProducts = false;
  showProductModal = false;
  editingProduct: Partial<Product> = {
    category: 'IPhone',
    isAvailable: true,
    isFeatured: false
  };

  // Offers
  offers: Offer[] = [];
  loadingOffers = false;
  showOfferModal = false;
  editingOffer: Partial<Offer> = {
    badgeText: 'عرض خاص',
    isActive: true
  };

  // Settings
  currentSettings: StoreSettings = {
    storeName: '',
    phone: '',
    whatsApp: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    welcomeMessage: '',
    address: ''
  };
  saveSettingsSuccess = false;
  savingSettings = false;

  constructor(
    private analyticsService: AnalyticsService,
    private productService: ProductService,
    public settingsService: SettingsService,
    private offersService: OffersService,
    public auth: AuthService
  ) {}

  updateAccountCredentials(): void {
    this.accountMsg = '';
    this.accountError = '';

    if (!this.currentPassword) {
      this.accountError = 'يرجى إدخال كلمة المرور الحالية لتأكيد الهوية';
      return;
    }

    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.accountError = 'كلمة المرور الجديدة غير متطابقة مع التأكيد';
      return;
    }

    if (!this.newEmail && !this.newPassword) {
      this.accountError = 'يرجى إدخال البريد الإلكتروني الجديد أو كلمة المرور الجديدة';
      return;
    }

    this.updatingAccount = true;
    this.auth.changeCredentials({
      currentPassword: this.currentPassword,
      newEmail: this.newEmail || undefined,
      newPassword: this.newPassword || undefined
    }).subscribe({
      next: () => {
        this.updatingAccount = false;
        this.accountMsg = 'تم تحديث بيانات حساب الأدمن بنجاح!';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        setTimeout(() => this.accountMsg = '', 4000);
      },
      error: (err) => {
        this.updatingAccount = false;
        this.accountError = err.error?.message || 'تعذر تحديث البيانات، تأكد من صحة كلمة المرور الحالية';
      }
    });
  }

  ngOnInit(): void {
    this.loadSummary();
    this.loadProducts();
    this.loadOffers();
    this.loadSettings();
  }

  loadSummary(): void {
    this.loadingSummary = true;
    this.analyticsService.getSummary().subscribe({
      next: (data) => {
        this.summary = data;
        this.loadingSummary = false;
      },
      error: () => {
        this.loadingSummary = false;
      }
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
      }
    });
  }

  loadOffers(): void {
    this.loadingOffers = true;
    this.offersService.getAllOffersAdmin().subscribe({
      next: (data) => {
        this.offers = data;
        this.loadingOffers = false;
      },
      error: () => {
        this.loadingOffers = false;
      }
    });
  }

  loadSettings(): void {
    this.settingsService.getSettings().subscribe({
      next: (data) => {
        this.currentSettings = { ...data };
      }
    });
  }

  // Product Actions
  openCreateProduct(): void {
    this.editingProduct = {
      name: '',
      category: 'IPhone',
      description: '',
      price: 0,
      oldPrice: undefined,
      imageUrl: '',
      isAvailable: true,
      isFeatured: false
    };
    this.showProductModal = true;
  }

  openEditProduct(p: Product): void {
    this.editingProduct = { ...p };
    this.showProductModal = true;
  }

  saveProduct(): void {
    if (!this.editingProduct.name || !this.editingProduct.price) {
      alert('يرجى كتابة اسم المنتج وسعره');
      return;
    }

    if (this.editingProduct.id) {
      this.productService.updateProduct(this.editingProduct.id, this.editingProduct).subscribe({
        next: () => {
          this.showProductModal = false;
          this.loadProducts();
        }
      });
    } else {
      this.productService.createProduct(this.editingProduct).subscribe({
        next: () => {
          this.showProductModal = false;
          this.loadProducts();
        }
      });
    }
  }

  deleteProduct(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => this.loadProducts()
      });
    }
  }

  // Offer Actions
  openCreateOffer(): void {
    this.editingOffer = {
      title: '',
      description: '',
      badgeText: 'عرض حصري',
      imageUrl: '',
      actionUrl: '#products',
      isActive: true
    };
    this.showOfferModal = true;
  }

  openEditOffer(offer: Offer): void {
    this.editingOffer = { ...offer };
    this.showOfferModal = true;
  }

  saveOffer(): void {
    if (!this.editingOffer.title) {
      alert('يرجى كتابة عنوان العرض');
      return;
    }

    if (this.editingOffer.id) {
      this.offersService.updateOffer(this.editingOffer.id, this.editingOffer).subscribe({
        next: () => {
          this.showOfferModal = false;
          this.loadOffers();
        }
      });
    } else {
      this.offersService.createOffer(this.editingOffer).subscribe({
        next: () => {
          this.showOfferModal = false;
          this.loadOffers();
        }
      });
    }
  }

  deleteOffer(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      this.offersService.deleteOffer(id).subscribe({
        next: () => this.loadOffers()
      });
    }
  }

  // Settings Actions
  saveSettings(): void {
    this.savingSettings = true;
    this.saveSettingsSuccess = false;
    this.settingsService.updateSettings(this.currentSettings).subscribe({
      next: () => {
        this.savingSettings = false;
        this.saveSettingsSuccess = true;
        setTimeout(() => this.saveSettingsSuccess = false, 3500);
      },
      error: () => {
        this.savingSettings = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }
}
