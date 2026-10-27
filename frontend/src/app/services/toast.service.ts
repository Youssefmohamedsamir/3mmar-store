import { Injectable, signal } from '@angular/core';

export interface ToastData {
  title: string;
  message: string;
  type: 'done' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  activeToast = signal<ToastData | null>(null);
  private timer: any = null;

  showDone(title: string = 'Done ✓', message: string = 'تمت العملية بنجاح بأعلى أداء'): void {
    this.show({
      title,
      message,
      type: 'done'
    });
  }

  showError(message: string, title: string = 'تنبيه'): void {
    this.show({
      title,
      message,
      type: 'error'
    });
  }

  show(toast: ToastData): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.activeToast.set(toast);
    this.timer = setTimeout(() => {
      this.activeToast.set(null);
    }, 3500);
  }

  dismiss(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.activeToast.set(null);
  }
}
