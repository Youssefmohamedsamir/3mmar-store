import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent {
  @Output() startClick = new EventEmitter<void>();

  constructor(
    public settings: SettingsService,
    public pwa: PwaService
  ) {}

  onStart(): void {
    this.startClick.emit();
  }
}
