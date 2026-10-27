import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.scss']
})
export class MediaComponent {
  constructor(public settings: SettingsService) {}

  openLink(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
