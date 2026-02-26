import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AlertsComponent } from '../../../shared/alerts/alerts.component';
import { ButtonsComponent } from '../../../shared/buttons/buttons';

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, AlertsComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly token = signal(this.readTokenFromQueryParam());
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly touched = signal({
    newPassword: false,
    confirmPassword: false,
  });
  readonly submitted = signal(false);
  readonly pending = signal(false);
  readonly message = signal<string | null>(null);
  readonly status = signal<'success' | 'error' | null>(null);

  readonly hasToken = computed(() => !!this.token());

  readonly newPasswordError = computed<string | null>(() => {
    const show = this.submitted() || this.touched().newPassword;
    if (!show) return null;

    const value = this.newPassword();
    if (!value) return 'Informe a nova senha.';
    if (value.length < 8) return 'A nova senha deve ter ao menos 8 caracteres.';
    return null;
  });

  readonly confirmPasswordError = computed<string | null>(() => {
    const show = this.submitted() || this.touched().confirmPassword;
    if (!show) return null;

    if (!this.confirmPassword()) return 'Confirme a nova senha.';
    if (this.confirmPassword() !== this.newPassword()) return 'As senhas nao conferem.';
    return null;
  });

  readonly hasFormErrors = computed(
    () => !!this.newPasswordError() || !!this.confirmPasswordError(),
  );

  readonly canSubmit = computed(() => this.hasToken() && !this.hasFormErrors() && !this.pending());

  markTouched(field: 'newPassword' | 'confirmPassword'): void {
    this.touched.update((current) => ({
      ...current,
      [field]: true,
    }));
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    this.message.set(null);
    this.status.set(null);

    if (!this.canSubmit()) return;

    this.pending.set(true);
    try {
      await this.auth.resetPassword(this.token(), this.newPassword());
      this.status.set('success');
      this.message.set('Senha alterada com sucesso. Agora faca login com sua nova senha.');
      this.newPassword.set('');
      this.confirmPassword.set('');
    } catch (error: unknown) {
      this.status.set('error');
      this.message.set(this.resolveError(error));
    } finally {
      this.pending.set(false);
    }
  }

  async goToLogin(): Promise<void> {
    await this.router.navigateByUrl('/login');
  }

  private readTokenFromQueryParam(): string {
    const token = this.route.snapshot.queryParamMap.get('token');
    return typeof token === 'string' ? token.trim() : '';
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = typeof error.error?.error === 'string' ? error.error.error : null;
      if (backendMessage) return backendMessage;
    }

    if (error instanceof Error && error.message.trim()) return error.message;

    return 'Nao foi possivel redefinir a senha.';
  }
}
