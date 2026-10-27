import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
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
export class ProductListComponent implements OnInit, OnChanges {
  @Input() selectedCategory: string = 'IPhone';
  @Output() requireAuth = new EventEmitter<{ productId: number; type: 'WhatsApp' | 'Phone' }>();
  @Output() openAdmin = new EventEmitter<void>();

  products: Product[] = [];
  loading = false;
  searchQuery = '';
  activeImages: Map<number, string> = new Map();

  getActiveImage(product: Product): string {
    return this.activeImages.get(product.id) || product.imageUrl || 'logo.png';
  }

  selectImage(product: Product, img: string): void {
    this.activeImages.set(product.id, img);
  }

  constructor(
    private productService: ProductService,
    public settings: SettingsService,
    public auth: AuthService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
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
      if (cached) {
        this.products = cached;
        this.loading = false;
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
