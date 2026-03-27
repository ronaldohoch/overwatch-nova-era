import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { ModalRef } from '../../../../shared/modal/modal-ref';
import { AlertsComponent } from '../../../../shared/alerts/alerts.component';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { InputComponent, OwInputState } from '../../../../shared/design-system/input/input.component';

@Component({
  selector: 'app-recuperar-senha',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, AlertsComponent, ReactiveFormsModule, InputComponent],
  templateUrl: './recuperar-senha.component.html',
  styleUrl: './recuperar-senha.component.css',
})
export class RecuperarSenhaComponent {
  private readonly modalRef = inject(ModalRef);
  private readonly auth = inject(AuthService);

  readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  readonly submitted = signal(false);
  readonly pending = signal(false);
  readonly message = signal<string | null>(null);
  readonly status = signal<'success' | 'error' | null>(null);

  emailState(): OwInputState {
    return this.emailControl.invalid && (this.emailControl.touched || this.submitted())
      ? 'error'
      : 'default';
  }

  emailError(): string | undefined {
    if (!this.emailControl.invalid || (!this.emailControl.touched && !this.submitted())) return undefined;
    if (this.emailControl.hasError('required')) return 'Informe o e-mail.';
    if (this.emailControl.hasError('email')) return 'Informe um e-mail válido.';
    return undefined;
  }

  close(): void {
    this.modalRef.close(null);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    this.message.set(null);
    this.status.set(null);

    if (this.emailControl.invalid) return;

    this.pending.set(true);

    try {
      await this.auth.forgotPassword(this.emailControl.value.trim());
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
