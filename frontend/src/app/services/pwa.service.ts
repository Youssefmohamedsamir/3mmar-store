import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any = null;
  canInstall = signal<boolean>(true);
  isIOS = signal<boolean>(false);
  showIOSInstructions = signal<boolean>(false);

  constructor() {
    this.checkPlatform();
    this.initPwa();
  }

  private checkPlatform(): void {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(ua);
      const isStandalone = ('standalone' in window.navigator && (window.navigator as any).standalone) ||
                           window.matchMedia('(display-mode: standalone)').matches;

      this.isIOS.set(isIosDevice);

      // If already installed, hide prompt
      if (isStandalone) {
        this.canInstall.set(false);
      }
    }
  }

  private initPwa(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.canInstall.set(true);
      });

      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.canInstall.set(false);
      });
    }
  }

  installApp(): void {
    if (this.isIOS()) {
      this.showIOSInstructions.set(true);
      return;
    }

    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          this.canInstall.set(false);
        }
        this.deferredPrompt = null;
      });
    } else {
      // Direct instruction fallback for Android/Chrome/Edge
      alert('لتنزيل التطبيق: اضغط على خيارات المتصفح (⋮) ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"');
    }
  }

  closeIOSModal(): void {
    this.showIOSInstructions.set(false);
  }
}
