import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss']
})
export class AuthModalComponent {
  @Input() isOpen = false;
  @Input() pendingAction: { productId: number; type: 'WhatsApp' | 'Phone' } | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<{ productId: number; type: 'WhatsApp' | 'Phone' } | null>();

  mode: 'login' | 'register' = 'login';
  errorMessage = '';
  loading = false;

  // Form fields
  fullName = '';
  email = '';
  password = '';

  constructor(
    private auth: AuthService,
    private toast: ToastService
  ) {}

  onClose(): void {
    this.errorMessage = '';
    this.close.emit();
  }

  setMode(m: 'login' | 'register'): void {
    this.mode = m;
    this.errorMessage = '';
  }

  private getFriendlyErrorMessage(err: any, defaultMsg: string): string {
    if (err.name === 'TimeoutError' || err.status === 0) {
      return 'تعذر الاتصال بسيرفر الباك إند، تأكد من تشغيل الباك إند (dotnet run على المنفذ 5000)';
    }
    return err.error?.message || defaultMsg;
  }

  handleSocialLogin(provider: 'Google' | 'Facebook'): void {
    this.loading = true;
    this.errorMessage = '';

    const randomSuffix = Math.floor(Math.random() * 899999 + 100000);
    const userEmail = this.email?.trim() || `${provider.toLowerCase()}.user_${randomSuffix}@gmail.com`;
    const userName = this.fullName?.trim() || (provider === 'Google' ? 'عميل جوجل' : 'عميل فيسبوك');

    this.auth.socialLogin({
      provider,
      providerId: `${provider.toLowerCase()}_${Date.now()}_${randomSuffix}`,
      email: userEmail,
      fullName: userName,
      avatarUrl: ''
    }).subscribe({
      next: () => {
        this.loading = false;
        this.toast.showDone('Done ✓', `مرحباً بك ${userName}! تم الدخول بنجاح`);
        this.loginSuccess.emit(this.pendingAction);
        this.onClose();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.getFriendlyErrorMessage(err, 'تعذر تسجيل الدخول بواسطة ' + provider);
      }
    });
  }

  submitLocal(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    if (this.mode === 'login') {
      this.auth.login({ email: this.email, password: this.password }).subscribe({
        next: (res) => {
          this.loading = false;
          this.toast.showDone('Done ✓', `مرحباً بك ${res.fullName}! تم تسجيل الدخول بنجاح`);
          this.loginSuccess.emit(this.pendingAction);
          this.onClose();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = this.getFriendlyErrorMessage(err, 'البريد أو كلمة المرور غير صحيحة');
        }
      });
    } else {
      if (!this.fullName) {
        this.errorMessage = 'يرجى إدخال الاسم بالكامل';
        this.loading = false;
        return;
      }
      this.auth.register({ fullName: this.fullName, email: this.email, password: this.password }).subscribe({
        next: (res) => {
          this.loading = false;
          this.toast.showDone('Done ✓', `أهلاً بك يا ${res.fullName}! تم إنشاء حسابك بنجاح`);
          this.loginSuccess.emit(this.pendingAction);
          this.onClose();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = this.getFriendlyErrorMessage(err, 'تعذر إنشاء الحساب');
        }
      });
    }
  }
}
