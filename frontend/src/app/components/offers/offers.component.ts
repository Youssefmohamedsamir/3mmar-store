import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Offer } from '../../models/models';
import { OffersService } from '../../services/offers.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss']
})
export class OffersComponent implements OnInit, OnDestroy {
  offers: Offer[] = [];
  loading = false;
  activeImages: Map<number, string> = new Map();
  selectedOffer: Offer | null = null;
  modalActiveImage: string = '';
  private autoSlideTimer: any = null;

  constructor(
    private offersService: OffersService,
    public settings: SettingsService
  ) {}

  ngOnInit(): void {
    this.loadOffers();
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
    }
  }

  private startAutoSlide(): void {
    this.autoSlideTimer = setInterval(() => {
      for (const offer of this.offers) {
        const list = this.getImagesList(offer);
        if (list.length > 1) {
          const current = this.getActiveImage(offer);
          const currentIdx = list.indexOf(current);
          const nextIdx = (currentIdx + 1) % list.length;
          this.activeImages.set(offer.id, list[nextIdx]);
        }
      }
    }, 3800);
  }

  getImagesList(offer: Offer): string[] {
    if (offer.images && offer.images.length > 0) {
      return offer.images;
    }
    return [offer.imageUrl || 'logo.png'];
  }

  getActiveImage(offer: Offer): string {
    return this.activeImages.get(offer.id) || offer.imageUrl || (offer.images && offer.images.length > 0 ? offer.images[0] : 'logo.png');
  }

  getCurrentImageIndex(offer: Offer): number {
    const list = this.getImagesList(offer);
    const current = this.getActiveImage(offer);
    const idx = list.indexOf(current);
    return idx >= 0 ? idx : 0;
  }

  selectImage(offer: Offer, img: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeImages.set(offer.id, img);
  }

  nextImage(offer: Offer, event?: Event): void {
    if (event) event.stopPropagation();
    const list = this.getImagesList(offer);
    if (list.length <= 1) return;
    const currentIdx = this.getCurrentImageIndex(offer);
    const nextIdx = (currentIdx + 1) % list.length;
    this.selectImage(offer, list[nextIdx]);
  }

  prevImage(offer: Offer, event?: Event): void {
    if (event) event.stopPropagation();
    const list = this.getImagesList(offer);
    if (list.length <= 1) return;
    const currentIdx = this.getCurrentImageIndex(offer);
    const prevIdx = (currentIdx - 1 + list.length) % list.length;
    this.selectImage(offer, list[prevIdx]);
  }

  openOfferDetails(offer: Offer): void {
    this.selectedOffer = offer;
    this.modalActiveImage = this.getActiveImage(offer);
  }

  closeOfferDetails(): void {
    this.selectedOffer = null;
  }

  selectModalImage(img: string): void {
    this.modalActiveImage = img;
  }

  nextModalImage(): void {
    if (!this.selectedOffer) return;
    const list = this.getImagesList(this.selectedOffer);
    if (list.length <= 1) return;
    const currentIdx = list.indexOf(this.modalActiveImage);
    const nextIdx = (currentIdx + 1) % list.length;
    this.modalActiveImage = list[nextIdx];
  }

  prevModalImage(): void {
    if (!this.selectedOffer) return;
    const list = this.getImagesList(this.selectedOffer);
    if (list.length <= 1) return;
    const currentIdx = list.indexOf(this.modalActiveImage);
    const prevIdx = (currentIdx - 1 + list.length) % list.length;
    this.modalActiveImage = list[prevIdx];
  }

  claimOffer(offer: Offer, type: 'WhatsApp' | 'Phone'): void {
    const s = this.settings.settings();
    if (type === 'WhatsApp') {
      const cleanPhone = (s.whatsApp || '201044858440').replace(/[^0-9]/g, '');
      const msg = `مرحباً متجر 3mmar $tore، أود الاستفسار وطلب العرض:\n*${offer.title}*\nالشارة: ${offer.badgeText}`;
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    } else {
      const cleanPhone = (s.phone || '+201044858440').trim();
      window.location.href = `tel:${cleanPhone}`;
    }
  }

  loadOffers(): void {
    if (this.offersService.hasCached()) {
      const cached = this.offersService.getCached();
      if (cached) {
        this.offers = cached;
        this.loading = false;
        // Background revalidation
        this.offersService.getOffers(true).subscribe({
          next: (data) => {
            this.offers = data;
          }
        });
        return;
      }
    }

    this.loading = true;
    this.offersService.getOffers().subscribe({
      next: (data) => {
        this.offers = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  scrollToProducts(): void {
    const el = document.getElementById('categories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
