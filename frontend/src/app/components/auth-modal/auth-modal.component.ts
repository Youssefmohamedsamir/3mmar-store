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
  errorTitle = '';
  showRegisterSwitch = false;
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
    this.errorTitle = '';
    this.showRegisterSwitch = false;
    this.loading = false;
    this.close.emit();
  }

  setMode(m: 'login' | 'register'): void {
    this.mode = m;
    this.errorMessage = '';
    this.errorTitle = '';
    this.showRegisterSwitch = false;
  }

  switchToRegister(): void {
    this.mode = 'register';
    this.errorMessage = '';
    this.errorTitle = '';
    this.showRegisterSwitch = false;
  }

  private getFriendlyErrorMessage(err: any, defaultMsg: string): string {
    if (err.name === 'TimeoutError' || err.status === 0) {
      return 'تعذر الاتصال بسيرفر المتجر، يرجى التحقق من اتصال الإنترنت أو إعادة المحاولة بعد لحظات.';
    }
    return err.error?.message || defaultMsg;
  }

  handleSocialLogin(provider: 'Google' | 'Facebook'): void {
    this.loading = true;
    this.errorMessage = '';
    this.errorTitle = '';
    this.showRegisterSwitch = false;

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
        this.errorTitle = 'تعذر الدخول';
        this.errorMessage = this.getFriendlyErrorMessage(err, 'تعذر تسجيل الدخول بواسطة ' + provider);
      }
    });
  }

  submitLocal(): void {
    this.errorMessage = '';
    this.errorTitle = '';
    this.showRegisterSwitch = false;

    if (!this.email || !this.email.trim()) {
      this.errorTitle = 'تنبيه: البريد مطلوب';
      this.errorMessage = 'يرجى إدخال البريد الإلكتروني للمتابعة.';
      this.loading = false;
      return;
    }

    if (!this.password || !this.password.trim()) {
      this.errorTitle = 'تنبيه: كلمة المرور مطلوبة';
      this.errorMessage = 'يرجى إدخال كلمة المرور للمتابعة.';
      this.loading = false;
      return;
    }

    this.loading = true;

    if (this.mode === 'login') {
      this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
        next: (res) => {
          this.loading = false;
          this.toast.showDone('Done ✓', `مرحباً بك ${res.fullName}! تم تسجيل الدخول بنجاح`);
          this.loginSuccess.emit(this.pendingAction);
          this.onClose();
        },
        error: (err) => {
          this.loading = false;
          const errCode = err.error?.code;
          const backendMsg = err.error?.message || '';

          if (errCode === 'ACCOUNT_NOT_FOUND' || backendMsg.includes('غير مسجل') || backendMsg.includes('ليس له حساب')) {
            this.errorTitle = 'تنبيه: هذا البريد غير مسجل لدينا!';
            this.errorMessage = backendMsg || 'هذا البريد الإلكتروني ليس له حساب مسبق في متجرنا. يرجى إنشاء حساب جديد أولاً لتتمكن من الدخول ومتابعة طلباتك.';
            this.showRegisterSwitch = true;
          } else if (errCode === 'INVALID_PASSWORD' || backendMsg.includes('كلمة المرور غير صحيحة')) {
            this.errorTitle = 'خطأ في كلمة المرور';
            this.errorMessage = backendMsg || 'كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.';
            this.showRegisterSwitch = false;
          } else {
            this.errorTitle = 'تعذر تسجيل الدخول';
            this.errorMessage = this.getFriendlyErrorMessage(err, 'البريد أو كلمة المرور غير صحيحة');
            this.showRegisterSwitch = false;
          }
        }
      });
    } else {
      if (!this.fullName || !this.fullName.trim()) {
        this.errorTitle = 'تنبيه: الاسم مطلوب';
        this.errorMessage = 'يرجى إدخال الاسم بالكامل لإنشاء الحساب.';
        this.loading = false;
        return;
      }
      this.auth.register({ fullName: this.fullName.trim(), email: this.email.trim(), password: this.password }).subscribe({
        next: (res) => {
          this.loading = false;
          this.toast.showDone('Done ✓', `أهلاً بك يا ${res.fullName}! تم إنشاء حسابك بنجاح`);
          this.loginSuccess.emit(this.pendingAction);
          this.onClose();
        },
        error: (err) => {
          this.loading = false;
          this.errorTitle = 'تعذر إنشاء الحساب';
          this.errorMessage = this.getFriendlyErrorMessage(err, 'تعذر إنشاء الحساب، قد يكون البريد مسجلاً مسبقاً');
        }
      });
    }
  }
}
