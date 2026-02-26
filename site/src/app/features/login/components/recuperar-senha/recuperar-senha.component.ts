import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { ModalRef } from '../../../../shared/modal/modal-ref';
import { AlertsComponent } from '../../../../shared/alerts/alerts.component';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';

@Component({
  selector: 'app-recuperar-senha',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, AlertsComponent],
  templateUrl: './recuperar-senha.component.html',
  styleUrl: './recuperar-senha.component.css',
})
export class RecuperarSenhaComponent {
  private readonly modalRef = inject(ModalRef);
  private readonly auth = inject(AuthService);

  readonly email = signal('');
  readonly touched = signal(false);
  readonly submitted = signal(false);
  readonly pending = signal(false);
  readonly message = signal<string | null>(null);
  readonly status = signal<'success' | 'error' | null>(null);

  readonly emailError = computed<string | null>(() => {
    const show = this.submitted() || this.touched();
    if (!show) return null;

    const value = this.email().trim();
    if (!value) return 'Informe o e-mail.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Informe um e-mail válido.';
    return null;
  });

  readonly hasError = computed(() => {
    const value = this.email().trim();
    return !value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  });

  close(): void {
    this.modalRef.close(null);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    this.message.set(null);
    this.status.set(null);

    if (this.hasError()) return;

    this.pending.set(true);

    try {
      await this.auth.forgotPassword(this.email().trim());
      this.message.set('Se o e-mail existir, você receberá um link em breve.');
      this.status.set('success');
    } catch (error: unknown) {
      this.message.set(this.resolveError(error));
      this.status.set('error');
    } finally {
      this.pending.set(false);
    }
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = typeof error.error?.error === 'string' ? error.error.error : null;
      if (backendMessage) return backendMessage;
    }

    if (error instanceof Error && error.message.trim()) return error.message;

    return 'Não foi possível enviar o e-mail. Tente novamente.';
  }
}
