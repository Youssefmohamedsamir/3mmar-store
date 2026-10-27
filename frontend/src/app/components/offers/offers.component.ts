import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Offer } from '../../models/models';
import { OffersService } from '../../services/offers.service';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss']
})
export class OffersComponent implements OnInit {
  offers: Offer[] = [];
  loading = false;
  activeImages: Map<number, string> = new Map();

  constructor(private offersService: OffersService) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  getActiveImage(offer: Offer): string {
    return this.activeImages.get(offer.id) || offer.imageUrl || (offer.images && offer.images.length > 0 ? offer.images[0] : 'logo.png');
  }

  selectImage(offer: Offer, img: string): void {
    this.activeImages.set(offer.id, img);
  }

  loadOffers(): void {
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
