import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Output() openAuthModal = new EventEmitter<void>();
  @Output() navigateSection = new EventEmitter<string>();

  mobileMenuOpen = false;

  constructor(
    public auth: AuthService,
    public settings: SettingsService
  ) {}

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  goTo(sectionId: string): void {
    this.mobileMenuOpen = false;
    this.navigateSection.emit(sectionId);
  }

  handleAuthClick(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.logout();
    } else {
      this.openAuthModal.emit();
    }
  }
}
