import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class AdminDashboardComponent implements OnInit, OnDestroy {
  activeTab: 'analytics' | 'products' | 'offers' | 'settings' | 'account' = 'analytics';

  private autoRefreshTimer: any = null;

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
  savingProduct = false;
  productImages: string[] = [];
  editingProduct: Partial<Product> = {
    category: 'IPhone',
    isAvailable: true,
    isFeatured: false
  };

  // Offers
  offers: Offer[] = [];
  loadingOffers = false;
  showOfferModal = false;
  savingOffer = false;
  offerImages: string[] = [];
  editingOffer: Partial<Offer> = {
    badgeText: 'عرض خاص',
    isActive: true,
    isLimitedTime: false
  };

  // Toast Notification System
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMsg = msg;
    this.toastType = type;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMsg = '';
    }, 4000);
  }

  // Sales / Earnings Recording
  showSaleModal = false;
  savingSale = false;
  newSale = {
    productId: null as number | null,
    productName: '',
    quantitySold: 1,
    salePrice: 0,
    costPrice: 0,
    customerName: '',
    customerPhone: '',
    notes: ''
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

  setTab(tab: 'analytics' | 'products' | 'offers' | 'settings' | 'account'): void {
    this.activeTab = tab;
    this.showProductModal = false;
    this.showOfferModal = false;
    if (tab === 'products') {
      this.loadProducts();
    } else if (tab === 'offers') {
      this.loadOffers();
    } else if (tab === 'analytics') {
      this.loadSummary();
    } else if (tab === 'settings') {
      this.loadSettings();
    }
  }

  closeProductModal(): void {
    if (!this.savingProduct) {
      this.showProductModal = false;
    }
  }

  closeOfferModal(): void {
    if (!this.savingOffer) {
      this.showOfferModal = false;
    }
  }

  private compressImage(file: File, maxWidth = 850, maxHeight = 850, quality = 0.76): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target.result as string);
          }
        };
        img.onerror = () => resolve(e.target.result as string);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  async onProductImagesSelected(event: any): Promise<void> {
    const files: FileList | null = event.target?.files;
    if (!files || files.length === 0) return;

    if (this.productImages.length >= 10) {
      alert('الحد الأقصى المسموح به هو 10 صور للمنتج الواحد.');
      event.target.value = '';
      return;
    }

    const availableSlots = 10 - this.productImages.length;
    const countToProcess = Math.min(files.length, availableSlots);

    for (let i = 0; i < countToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const compressedBase64 = await this.compressImage(file);
        if (compressedBase64 && !this.productImages.includes(compressedBase64)) {
          if (this.productImages.length < 10) {
            this.productImages.push(compressedBase64);
          }
        }
      }
    }

    if (files.length > availableSlots) {
      alert(`تم رفع ${countToProcess} صور للوصول إلى الحد الأقصى (10 صور).`);
    }

    if (!this.editingProduct.imageUrl && this.productImages.length > 0) {
      this.editingProduct.imageUrl = this.productImages[0];
    }
    event.target.value = '';
  }

  setPrimaryProductImage(img: string): void {
    this.editingProduct.imageUrl = img;
    const idx = this.productImages.indexOf(img);
    if (idx > 0) {
      this.productImages.splice(idx, 1);
      this.productImages.unshift(img);
    }
  }

  removeProductImageAt(index: number): void {
    const removed = this.productImages.splice(index, 1)[0];
    if (this.editingProduct.imageUrl === removed) {
      this.editingProduct.imageUrl = this.productImages[0] || '';
    }
  }

  addImageFromUrl(url: string): void {
    const clean = url?.trim();
    if (!clean) return;

    if (this.productImages.length >= 10) {
      alert('الحد الأقصى المسموح به هو 10 صور للمنتج.');
      return;
    }

    if (!this.productImages.includes(clean)) {
      this.productImages.push(clean);
      if (!this.editingProduct.imageUrl) {
        this.editingProduct.imageUrl = clean;
      }
    }
  }

  async onOfferImagesSelected(event: any): Promise<void> {
    const files: FileList | null = event.target?.files;
    if (!files || files.length === 0) return;

    if (this.offerImages.length >= 10) {
      alert('الحد الأقصى المسموح به هو 10 صور للعرض الواحد.');
      event.target.value = '';
      return;
    }

    const availableSlots = 10 - this.offerImages.length;
    const countToProcess = Math.min(files.length, availableSlots);

    for (let i = 0; i < countToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const compressedBase64 = await this.compressImage(file);
        if (compressedBase64 && !this.offerImages.includes(compressedBase64)) {
          if (this.offerImages.length < 10) {
            this.offerImages.push(compressedBase64);
          }
        }
      }
    }

    if (files.length > availableSlots) {
      alert(`تم رفع ${countToProcess} صور للوصول إلى الحد الأقصى (10 صور).`);
    }

    if (!this.editingOffer.imageUrl && this.offerImages.length > 0) {
      this.editingOffer.imageUrl = this.offerImages[0];
    }
    event.target.value = '';
  }

  setPrimaryOfferImage(img: string): void {
    this.editingOffer.imageUrl = img;
    const idx = this.offerImages.indexOf(img);
    if (idx > 0) {
      this.offerImages.splice(idx, 1);
      this.offerImages.unshift(img);
    }
  }

  removeOfferImageAt(index: number): void {
    const removed = this.offerImages.splice(index, 1)[0];
    if (this.editingOffer.imageUrl === removed) {
      this.editingOffer.imageUrl = this.offerImages[0] || '';
    }
  }

  addOfferImageFromUrl(url: string): void {
    const clean = url?.trim();
    if (!clean) return;

    if (this.offerImages.length >= 10) {
      alert('الحد الأقصى المسموح به هو 10 صور للعرض.');
      return;
    }

    if (!this.offerImages.includes(clean)) {
      this.offerImages.push(clean);
      if (!this.editingOffer.imageUrl) {
        this.editingOffer.imageUrl = clean;
      }
    }
  }

  removeProductImage(): void {
    this.editingProduct.imageUrl = '';
    this.productImages = [];
  }

  removeOfferImage(): void {
    this.editingOffer.imageUrl = '';
    this.offerImages = [];
  }

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

    // Auto-refresh summary data every 10 seconds to instantly display new user registrations
    this.autoRefreshTimer = setInterval(() => {
      if (this.activeTab === 'analytics') {
        this.analyticsService.getSummary().subscribe({
          next: (data) => {
            this.summary = data;
          }
        });
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
    }
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
    this.productImages = [];
    this.editingProduct = {
      name: '',
      category: 'IPhone',
      description: '',
      price: 0,
      oldPrice: undefined,
      quantity: 1,
      imageUrl: '',
      images: [],
      isAvailable: true,
      isFeatured: false
    };
    this.showProductModal = true;
  }

  openEditProduct(p: Product): void {
    this.editingProduct = {
      ...p,
      quantity: p.quantity !== undefined ? p.quantity : 1
    };
    this.productImages = p.images && p.images.length > 0
      ? [...p.images]
      : (p.imageUrl ? [p.imageUrl] : []);
    this.showProductModal = true;
  }

  saveProduct(): void {
    if (!this.editingProduct.name || !this.editingProduct.name.trim()) {
      alert('يرجى كتابة اسم المنتج');
      return;
    }
    if (this.editingProduct.price === undefined || this.editingProduct.price === null || this.editingProduct.price < 0) {
      alert('يرجى كتابة سعر صحيح للمنتج');
      return;
    }

    this.savingProduct = true;

    // Attach images
    const imagesToSave = [...this.productImages];
    const primaryImg = this.editingProduct.imageUrl || (imagesToSave.length > 0 ? imagesToSave[0] : 'logo.png');

    const payload: Partial<Product> = {
      ...this.editingProduct,
      imageUrl: primaryImg,
      images: imagesToSave
    };

    // OPTIMISTIC UPDATE: update local state & close modal instantly
    const isEditing = !!this.editingProduct.id;
    const prevProducts = [...this.products];

    if (isEditing) {
      this.products = this.products.map(p => p.id === payload.id ? { ...p, ...payload } as Product : p);
    } else {
      const tempProduct: Product = {
        id: Date.now(),
        name: payload.name || '',
        category: payload.category || 'IPhone',
        description: payload.description || '',
        price: payload.price || 0,
        oldPrice: payload.oldPrice,
        quantity: payload.quantity !== undefined ? payload.quantity : 1,
        imageUrl: primaryImg,
        images: imagesToSave,
        isAvailable: payload.isAvailable ?? true,
        isFeatured: payload.isFeatured ?? false,
        createdAt: new Date().toISOString()
      };
      this.products = [tempProduct, ...this.products];
    }

    this.showProductModal = false;

    const request$ = isEditing
      ? this.productService.updateProduct(this.editingProduct.id!, payload)
      : this.productService.createProduct(payload);

    request$.subscribe({
      next: () => {
        this.savingProduct = false;
        this.productImages = [];
        this.loadProducts();
        this.showToast(isEditing ? 'تم تحديث المنتج بنجاح! Successfully Updated' : 'تم إضافة المنتج بنجاح! Successfully Created', 'success');
      },
      error: (err) => {
        this.savingProduct = false;
        console.error('Error saving product:', err);
        const errorDetail = err.status === 401
          ? 'انتهت صلاحية تسجيل الدخول للأدمن'
          : (err.error?.message || err.message || 'خطأ في الاتصال');
        this.showToast('تعذر حفظ المنتج: ' + errorDetail, 'error');
        this.loadProducts();
      }
    });
  }

  deleteProduct(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      const prevProducts = [...this.products];
      // Optimistic delete: disappears immediately in 0ms
      this.products = this.products.filter(p => p.id !== id);

      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
          this.showToast('تم حذف المنتج بنجاح! Successfully Deleted', 'success');
        },
        error: (err) => {
          this.products = prevProducts;
          console.error(err);
          this.showToast('تعذر حذف المنتج، يرجى المحاولة لاحقاً', 'error');
        }
      });
    }
  }

  // Offer Actions
  openCreateOffer(): void {
    this.offerImages = [];
    this.editingOffer = {
      title: '',
      description: '',
      badgeText: 'عرض حصري',
      imageUrl: '',
      images: [],
      actionUrl: '#products',
      isActive: true,
      isLimitedTime: false
    };
    this.showOfferModal = true;
  }

  openEditOffer(offer: Offer): void {
    this.editingOffer = {
      ...offer,
      isLimitedTime: !!offer.isLimitedTime
    };
    this.offerImages = offer.images && offer.images.length > 0
      ? [...offer.images]
      : (offer.imageUrl ? [offer.imageUrl] : []);
    this.showOfferModal = true;
  }

  saveOffer(): void {
    if (!this.editingOffer.title || !this.editingOffer.title.trim()) {
      this.showToast('يرجى كتابة عنوان العرض', 'error');
      return;
    }

    this.savingOffer = true;

    const imagesToSave = [...this.offerImages];
    const primaryImg = this.editingOffer.imageUrl || (imagesToSave.length > 0 ? imagesToSave[0] : 'logo.png');

    const payload: Partial<Offer> = {
      ...this.editingOffer,
      imageUrl: primaryImg,
      images: imagesToSave,
      isLimitedTime: !!this.editingOffer.isLimitedTime
    };

    // Optimistic update
    const isEditing = !!this.editingOffer.id;
    const prevOffers = [...this.offers];

    if (isEditing) {
      this.offers = this.offers.map(o => o.id === payload.id ? { ...o, ...payload } as Offer : o);
    } else {
      const tempOffer: Offer = {
        id: Date.now(),
        title: payload.title || '',
        description: payload.description || '',
        badgeText: payload.badgeText || 'عرض خاص',
        imageUrl: primaryImg,
        images: imagesToSave,
        actionUrl: payload.actionUrl || '#products',
        isActive: payload.isActive ?? true,
        isLimitedTime: !!payload.isLimitedTime
      };
      this.offers = [tempOffer, ...this.offers];
    }

    this.showOfferModal = false;

    const request$ = isEditing
      ? this.offersService.updateOffer(this.editingOffer.id!, payload)
      : this.offersService.createOffer(payload);

    request$.subscribe({
      next: () => {
        this.savingOffer = false;
        this.offerImages = [];
        this.loadOffers();
        this.showToast(isEditing ? 'تم تحديث العرض بنجاح! Successfully Updated' : 'تم إضافة العرض بنجاح! Successfully Created', 'success');
      },
      error: (err) => {
        this.savingOffer = false;
        console.error('Error saving offer:', err);
        const errorDetail = err.status === 401
          ? 'انتهت صلاحية تسجيل الدخول للأدمن'
          : (err.error?.message || err.message || 'خطأ في الاتصال');
        this.showToast('تعذر حفظ العرض: ' + errorDetail, 'error');
        this.loadOffers();
      }
    });
  }

  deleteOffer(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      const prevOffers = [...this.offers];
      this.offers = this.offers.filter(o => o.id !== id);

      this.offersService.deleteOffer(id).subscribe({
        next: () => {
          this.loadOffers();
          this.showToast('تم حذف العرض بنجاح! Successfully Deleted', 'success');
        },
        error: (err) => {
          this.offers = prevOffers;
          console.error(err);
          this.showToast('تعذر حذف العرض', 'error');
        }
      });
    }
  }

  // Sales / Earnings Recorder Actions
  openRecordSale(): void {
    const firstProduct = this.products.length > 0 ? this.products[0] : null;
    this.newSale = {
      productId: firstProduct ? firstProduct.id : null,
      productName: firstProduct ? firstProduct.name : '',
      quantitySold: 1,
      salePrice: firstProduct ? firstProduct.price : 0,
      costPrice: 0,
      customerName: '',
      customerPhone: '',
      notes: ''
    };
    this.showSaleModal = true;
  }

  onSaleProductChange(): void {
    const selected = this.products.find(p => p.id === Number(this.newSale.productId));
    if (selected) {
      this.newSale.productName = selected.name;
      this.newSale.salePrice = selected.price;
    }
  }

  saveSale(): void {
    if (!this.newSale.productName && !this.newSale.productId) {
      this.showToast('يرجى تحديد المنتج المباع', 'error');
      return;
    }
    if (this.newSale.quantitySold <= 0) {
      this.showToast('يرجى إدخال كمية صحيحة (1 أو أكثر)', 'error');
      return;
    }
    if (this.newSale.salePrice < 0) {
      this.showToast('يرجى كتابة سعر بيع صحيح', 'error');
      return;
    }

    this.savingSale = true;
    this.analyticsService.recordSale(this.newSale).subscribe({
      next: () => {
        this.savingSale = false;
        this.showSaleModal = false;
        this.loadSummary();
        this.loadProducts();
        this.showToast('تم تسجيل عملية البيع واحتساب الأرباح بنجاح! Successfully Recorded', 'success');
      },
      error: (err) => {
        this.savingSale = false;
        console.error(err);
        this.showToast('تعذر تسجيل عملية البيع: ' + (err.error?.message || err.message || 'خطأ في الاتصال'), 'error');
      }
    });
  }

  deleteSale(id: number): void {
    if (confirm('هل أنت متأكد من حذف عملية البيع واسترجاع القطع المباعة إلى مخزون المنتج؟')) {
      this.analyticsService.deleteSale(id).subscribe({
        next: () => {
          this.loadSummary();
          this.loadProducts();
          this.showToast('تم إلغاء عملية البيع واسترجاع الكميات للمخزون! Successfully Restored', 'success');
        },
        error: (err) => {
          console.error(err);
          this.showToast('تعذر حذف عملية البيع', 'error');
        }
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
        this.showToast('تم حفظ إعدادات المتجر بنجاح! Successfully Saved', 'success');
        setTimeout(() => this.saveSettingsSuccess = false, 3500);
      },
      error: () => {
        this.savingSettings = false;
        this.showToast('تعذر حفظ إعدادات المتجر', 'error');
      }
    });
  }

  formatNumber(num?: number): string {
    return (num || 0).toLocaleString();
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
