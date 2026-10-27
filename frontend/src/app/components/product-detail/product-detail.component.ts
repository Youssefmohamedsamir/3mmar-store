import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/models';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  @Input() product!: Product;
  @Input() allProducts: Product[] = [];
  @Output() back = new EventEmitter<void>();
  @Output() selectRelated = new EventEmitter<Product>();

  activeImage: string = '';
  activeImageIndex: number = 0;

  constructor(
    public settings: SettingsService,
    public auth: AuthService,
    private analytics: AnalyticsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.initImages();
  }

  ngOnChanges(): void {
    this.initImages();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private initImages(): void {
    if (this.product) {
      const list = this.getImagesList();
      this.activeImage = list[0] || 'logo.png';
      this.activeImageIndex = 0;
    }
  }

  getImagesList(): string[] {
    if (!this.product) return ['logo.png'];
    if (this.product.images && this.product.images.length > 0) {
      return this.product.images;
    }
    return [this.product.imageUrl || 'logo.png'];
  }

  setActiveImage(img: string, idx: number): void {
    this.activeImage = img;
    this.activeImageIndex = idx;
  }

  nextImage(): void {
    const list = this.getImagesList();
    if (list.length <= 1) return;
    this.activeImageIndex = (this.activeImageIndex + 1) % list.length;
    this.activeImage = list[this.activeImageIndex];
  }

  prevImage(): void {
    const list = this.getImagesList();
    if (list.length <= 1) return;
    this.activeImageIndex = (this.activeImageIndex - 1 + list.length) % list.length;
    this.activeImage = list[this.activeImageIndex];
  }

  handleOrder(type: 'WhatsApp' | 'Phone'): void {
    this.analytics.recordOrderIntent(this.product.id, type).subscribe();
    const currentSettings = this.settings.settings();
    const user = this.auth.currentUser();
    const clientName = user?.fullName ? ` من العميل: ${user.fullName}` : '';

    if (type === 'WhatsApp') {
      const cleanPhone = (currentSettings.whatsApp || '01044858440').replace(/[^0-9]/g, '');
      const message = `مرحباً متجر 3mmar $tore، أود طلب وحجز الجهاز المعروض بالتفصيل:\n*${this.product.name}*\nالسعر: ${this.product.price.toLocaleString()} ج.م\nالقسم: ${this.product.category}${clientName}`;
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      this.toast.showDone('Done ✓', 'تم تجهيز وتوجيه طلبك إلى واتساب المتجر بنجاح');
    } else {
      const cleanPhone = (currentSettings.phone || '01044858440').trim();
      window.location.href = `tel:${cleanPhone}`;
      this.toast.showDone('Done ✓', 'جاري تحويلك للاتصال الهاتفي بمتجر عمار');
    }
  }

  copyLink(): void {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.toast.showDone('Done ✓', 'تم نسخ رابط تفاصيل الجهاز بنجاح للمشاركة');
      }).catch(() => {
        this.toast.showDone('Done ✓', 'تم تجهيز رابط الجهاز للمشاركة');
      });
    } else {
      this.toast.showDone('Done ✓', 'تم تجهيز رابط الجهاز للمشاركة');
    }
  }

  getRelatedProducts(): Product[] {
    if (!this.product || !this.allProducts) return [];
    return this.allProducts
      .filter(p => p.id !== this.product.id && p.category === this.product.category)
      .slice(0, 4);
  }

  formatPrice(price?: number): string {
    return (price || 0).toLocaleString();
  }

  getDiscountAmount(): number {
    if (this.product.oldPrice && this.product.oldPrice > this.product.price) {
      return this.product.oldPrice - this.product.price;
    }
    return 0;
  }
}
