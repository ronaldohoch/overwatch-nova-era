import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ButtonsComponent } from '../../shared/buttons/buttons';

const SIGNUP_FIELDS = ['displayName', 'email', 'password', 'battletag'] as const;
const LOGIN_FIELDS = ['email', 'password'] as const;

type SignupField = (typeof SIGNUP_FIELDS)[number];

type SignupFormValue = Readonly<{
  displayName: string;
  email: string;
  password: string;
  battletag: string;
}>;

type SignupErrors = Readonly<Record<SignupField, string[]>>;
type SubmitStatus = 'success' | 'error';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly auth = inject(AuthService);

  readonly form = signal<SignupFormValue>({
    displayName: '',
    email: '',
    password: '',
    battletag: '',
  });

  readonly touched = signal<Record<SignupField, boolean>>({
    displayName: false,
    email: false,
    password: false,
    battletag: false,
  });

  readonly submitted = signal(false);
  readonly submitMessage = signal<string | null>(null);
  readonly submitStatus = signal<SubmitStatus | null>(null);
  readonly loginPending = signal(false);
  readonly isLogin = signal(false);

  readonly activeFields = computed<readonly SignupField[]>(() =>
    this.isLogin() ? LOGIN_FIELDS : SIGNUP_FIELDS,
  );

  readonly errors = computed<SignupErrors>(() =>
    this.validate(this.form(), this.isLogin()),
  );

  readonly hasErrors = computed(() =>
    this.activeFields().some((field) => this.errors()[field].length > 0),
  );

  readonly canSubmit = computed(() => !this.hasErrors());

  toggleLogin(): void {
    this.isLogin.update((value) => !value);
    this.submitted.set(false);
    this.submitMessage.set(null);
    this.submitStatus.set(null);
  }

  updateField(field: SignupField, value: string): void {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  markTouched(field: SignupField): void {
    this.touched.update((current) => ({ ...current, [field]: true }));
  }

  fieldError(field: SignupField): string | null {
    const show = this.submitted() || this.touched()[field];
    if (!show) return null;

    const [firstError] = this.errors()[field];
    return firstError ?? null;
  }

  async onCreate(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    this.submitMessage.set(null);
    this.submitStatus.set(null);

    if (!this.canSubmit()) return;

    this.loginPending.set(true);

    try {
      await this.auth.create({
        displayName: this.form().displayName,
        email: this.form().email,
        password: this.form().password,
        battletag: this.form().battletag,
      });

      this.submitMessage.set('Cadastro realizado com sucesso.');
      this.submitStatus.set('success');
    } catch (error: unknown) {
      this.submitMessage.set(this.resolveCreateError(error));
      this.submitStatus.set('error');
    } finally {
      this.loginPending.set(false);
    }
  }

  async onLogin(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    this.submitMessage.set(null);
    this.submitStatus.set(null);

    if (!this.canSubmit()) return;

    this.loginPending.set(true);

    try {
      await this.auth.login({
        email: this.form().email,
        password: this.form().password,
      });

      this.submitMessage.set('Login realizado com sucesso.');
      this.submitStatus.set('success');
    } catch (error: unknown) {
      this.submitMessage.set(this.resolveLoginError(error));
      this.submitStatus.set('error');
    } finally {
      this.loginPending.set(false);
    }
  }

  private validate(value: SignupFormValue, loginMode: boolean): SignupErrors {
    const displayNameErrors: string[] = [];
    const emailErrors: string[] = [];
    const passwordErrors: string[] = [];
    const battletagErrors: string[] = [];

    if (!loginMode && !value.displayName.trim()) {
      displayNameErrors.push('Informe o nome de exibicao.');
    }

    if (!value.email.trim()) {
      emailErrors.push('Informe o email.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
      emailErrors.push('Informe um email valido.');
    }

    if (!value.password) {
      passwordErrors.push('Informe a senha.');
    } else if (value.password.length < 8) {
      passwordErrors.push('A senha deve ter ao menos 8 caracteres.');
    }

    if (!loginMode) {
      if (!value.battletag.trim()) {
        battletagErrors.push('Informe a BattleTag.');
      } else if (!/^[A-Za-z0-9_]{3,16}#[0-9]{4,6}$/.test(value.battletag)) {
        battletagErrors.push('Use o formato Nome#1234.');
      }
    }

    return {
      displayName: displayNameErrors,
      email: emailErrors,
      password: passwordErrors,
      battletag: battletagErrors,
    };
  }

  private resolveLoginError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage =
        typeof error.error?.error === 'string' ? error.error.error : null;

      if (backendMessage) return backendMessage;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Nao foi possivel realizar o login.';
  }

  private resolveCreateError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage =
        typeof error.error?.error === 'string' ? error.error.error : null;

      if (backendMessage) return backendMessage;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Nao foi possivel realizar o cadastro.';
  }
}
