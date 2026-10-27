import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/models';
import { ProductService } from '../../services/product.service';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedCategory: string = 'IPhone';
  @Output() categoryChange = new EventEmitter<string>();
  @Output() requireAuth = new EventEmitter<{ productId: number; type: 'WhatsApp' | 'Phone' }>();
  @Output() openAdmin = new EventEmitter<void>();

  products: Product[] = [];
  loading = false;
  searchQuery = '';
  activeImages: Map<number, string> = new Map();
  selectedProduct: Product | null = null;
  modalActiveImage: string = '';
  private autoSlideTimer: any = null;

  categoryFilterTabs = [
    { id: 'IPhone', name: 'iPhone' },
    { id: 'Android', name: 'Android' },
    { id: 'Accessories', name: 'إكسسوارات' },
    { id: 'Other', name: 'أجهزة أخرى' }
  ];

  getImagesList(product: Product): string[] {
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return [product.imageUrl || 'logo.png'];
  }

  getActiveImage(product: Product): string {
    return this.activeImages.get(product.id) || product.imageUrl || 'logo.png';
  }

  getCurrentImageIndex(product: Product): number {
    const list = this.getImagesList(product);
    const current = this.getActiveImage(product);
    const idx = list.indexOf(current);
    return idx >= 0 ? idx : 0;
  }

  selectImage(product: Product, img: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeImages.set(product.id, img);
  }

  nextImage(product: Product, event?: Event): void {
    if (event) event.stopPropagation();
    const list = this.getImagesList(product);
    if (list.length <= 1) return;
    const currentIdx = this.getCurrentImageIndex(product);
    const nextIdx = (currentIdx + 1) % list.length;
    this.selectImage(product, list[nextIdx]);
  }

  prevImage(product: Product, event?: Event): void {
    if (event) event.stopPropagation();
    const list = this.getImagesList(product);
    if (list.length <= 1) return;
    const currentIdx = this.getCurrentImageIndex(product);
    const prevIdx = (currentIdx - 1 + list.length) % list.length;
    this.selectImage(product, list[prevIdx]);
  }

  openProductDetails(product: Product): void {
    this.selectedProduct = product;
    this.modalActiveImage = this.getActiveImage(product);
  }

  closeProductDetails(): void {
    this.selectedProduct = null;
  }

  selectModalImage(img: string): void {
    this.modalActiveImage = img;
  }

  nextModalImage(): void {
    if (!this.selectedProduct) return;
    const list = this.getImagesList(this.selectedProduct);
    if (list.length <= 1) return;
    const currentIdx = list.indexOf(this.modalActiveImage);
    const nextIdx = (currentIdx + 1) % list.length;
    this.modalActiveImage = list[nextIdx];
  }

  prevModalImage(): void {
    if (!this.selectedProduct) return;
    const list = this.getImagesList(this.selectedProduct);
    if (list.length <= 1) return;
    const currentIdx = list.indexOf(this.modalActiveImage);
    const prevIdx = (currentIdx - 1 + list.length) % list.length;
    this.modalActiveImage = list[prevIdx];
  }

  constructor(
    private productService: ProductService,
    public settings: SettingsService,
    public auth: AuthService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
    }
  }

  private startAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
    }
    this.autoSlideTimer = setInterval(() => {
      for (const product of this.products) {
        const list = this.getImagesList(product);
        if (list.length > 1) {
          const current = this.getActiveImage(product);
          const currentIdx = list.indexOf(current);
          const nextIdx = (currentIdx + 1) % list.length;
          this.activeImages.set(product.id, list[nextIdx]);
        }
      }
    }, 3800);
  }

  selectCategory(catId: string): void {
    if (this.selectedCategory === catId) return;
    this.selectedCategory = catId;
    this.categoryChange.emit(catId);
    this.loadProducts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCategory']) {
      this.loadProducts();
    }
  }

  loadProducts(): void {
    const isCached = this.productService.hasCached(this.selectedCategory) && !this.searchQuery;
    if (isCached) {
      const cached = this.productService.getCached(this.selectedCategory);
      if (cached !== null) {
        this.products = cached;
        this.loading = false;
        // Background revalidation to keep data fresh without blocking user
        this.productService.getProducts(this.selectedCategory, undefined, true).subscribe({
          next: (data) => {
            this.products = data;
          }
        });
        return;
      }
    }

    this.loading = true;
    this.productService.getProducts(this.selectedCategory, this.searchQuery).subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.loadProducts();
  }

  handleOrder(product: Product, type: 'WhatsApp' | 'Phone'): void {
    if (!this.auth.isLoggedIn()) {
      this.requireAuth.emit({ productId: product.id, type });
      return;
    }

    this.analytics.recordOrderIntent(product.id, type).subscribe();

    const currentSettings = this.settings.settings();

    if (type === 'WhatsApp') {
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

  formatPrice(price: number): string {
    return price.toLocaleString();
  }
}
