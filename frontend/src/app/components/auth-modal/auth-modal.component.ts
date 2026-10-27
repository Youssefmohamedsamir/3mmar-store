import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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

  constructor(private auth: AuthService) {}

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

    const mockEmail = provider === 'Google' ? 'google.user@example.com' : 'facebook.user@example.com';
    const mockName = provider === 'Google' ? 'مستخدم جوجل' : 'مستخدم فيسبوك';

    this.auth.socialLogin({
      provider,
      providerId: `${provider.toLowerCase()}_${Date.now()}`,
      email: mockEmail,
      fullName: mockName,
      avatarUrl: ''
    }).subscribe({
      next: () => {
        this.loading = false;
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
        next: () => {
          this.loading = false;
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
        next: () => {
          this.loading = false;
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
