import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ButtonsComponent } from '../../shared/buttons/buttons';
import { ModalService } from '../../shared/modal/modal.service';
import { ModalHostComponent } from '../../shared/modal/modal-host.component';
import { RecuperarSenhaComponent } from './components/recuperar-senha/recuperar-senha.component';

const SIGNUP_FIELDS = ['displayName', 'email', 'password', 'battletag', 'whatsapp'] as const;
const LOGIN_FIELDS = ['email', 'password'] as const;

type SignupField = (typeof SIGNUP_FIELDS)[number];
type LoginField = (typeof LOGIN_FIELDS)[number];

type SignupFormValue = Readonly<{
  displayName: string;
  email: string;
  password: string;
  battletag: string;
  whatsapp: string;
}>;

type LoginFormValue = Readonly<{
  email: string;
  password: string;
}>;

type SignupErrors = Readonly<Record<SignupField, string[]>>;
type LoginErrors = Readonly<Record<LoginField, string[]>>;
type SubmitStatus = 'success' | 'error';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, ModalHostComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modal = inject(ModalService);

  readonly signupForm = signal<SignupFormValue>({
    displayName: '',
    email: '',
    password: '',
    battletag: '',
    whatsapp: '',
  });

  readonly loginForm = signal<LoginFormValue>({
    email: '',
    password: '',
  });

  readonly signupTouched = signal<Record<SignupField, boolean>>({
    displayName: false,
    email: false,
    password: false,
    battletag: false,
    whatsapp: false,
  });

  readonly loginTouched = signal<Record<LoginField, boolean>>({
    email: false,
    password: false,
  });

  readonly signupSubmitted = signal(false);
  readonly loginSubmitted = signal(false);
  readonly signupMessage = signal<string | null>(null);
  readonly loginMessage = signal<string | null>(null);
  readonly signupStatus = signal<SubmitStatus | null>(null);
  readonly loginStatus = signal<SubmitStatus | null>(null);
  readonly signupPending = signal(false);
  readonly loginPending = signal(false);

  readonly signupErrors = computed<SignupErrors>(() => this.validateSignup(this.signupForm()));
  readonly loginErrors = computed<LoginErrors>(() => this.validateLogin(this.loginForm()));

  readonly signupHasErrors = computed(() =>
    SIGNUP_FIELDS.some((field) => this.signupErrors()[field].length > 0),
  );

  readonly loginHasErrors = computed(() =>
    LOGIN_FIELDS.some((field) => this.loginErrors()[field].length > 0),
  );

  readonly canSubmitSignup = computed(() => !this.signupHasErrors());
  readonly canSubmitLogin = computed(() => !this.loginHasErrors());

  openRecuperarSenha(): void {
    this.modal.open(RecuperarSenhaComponent);
  }

  updateSignupField(field: SignupField, value: string): void {
    this.signupForm.update((current) => ({ ...current, [field]: value }));
  }

  updateLoginField(field: LoginField, value: string): void {
    this.loginForm.update((current) => ({ ...current, [field]: value }));
  }

  markSignupTouched(field: SignupField): void {
    this.signupTouched.update((current) => ({ ...current, [field]: true }));
  }

  markLoginTouched(field: LoginField): void {
    this.loginTouched.update((current) => ({ ...current, [field]: true }));
  }

  signupFieldError(field: SignupField): string | null {
    const show = this.signupSubmitted() || this.signupTouched()[field];
    if (!show) return null;

    const [firstError] = this.signupErrors()[field];
    return firstError ?? null;
  }

  loginFieldError(field: LoginField): string | null {
    const show = this.loginSubmitted() || this.loginTouched()[field];
    if (!show) return null;

    const [firstError] = this.loginErrors()[field];
    return firstError ?? null;
  }

  async onCreate(event: Event): Promise<void> {
    event.preventDefault();
    this.signupSubmitted.set(true);
    this.signupMessage.set(null);
    this.signupStatus.set(null);

    if (!this.canSubmitSignup()) return;

    this.signupPending.set(true);

    try {
      await this.auth.create({
        displayName: this.signupForm().displayName,
        email: this.signupForm().email,
        password: this.signupForm().password,
        battletag: this.signupForm().battletag,
        whatsapp: this.signupForm().whatsapp,
      });

      this.signupMessage.set('Cadastro realizado com sucesso.');
      this.signupStatus.set('success');
      await this.navigateAfterAuthentication();
    } catch (error: unknown) {
      this.signupMessage.set(this.resolveCreateError(error));
      this.signupStatus.set('error');
    } finally {
      this.signupPending.set(false);
    }
  }

  async onLogin(event: Event): Promise<void> {
    event.preventDefault();
    this.loginSubmitted.set(true);
    this.loginMessage.set(null);
    this.loginStatus.set(null);

    if (!this.canSubmitLogin()) return;

    this.loginPending.set(true);

    try {
      await this.auth.login({
        email: this.loginForm().email,
        password: this.loginForm().password,
      });

      this.loginMessage.set('Login realizado com sucesso.');
      this.loginStatus.set('success');
      await this.navigateAfterAuthentication();
    } catch (error: unknown) {
      this.loginMessage.set(this.resolveLoginError(error));
      this.loginStatus.set('error');
    } finally {
      this.loginPending.set(false);
    }
  }

  private validateSignup(value: SignupFormValue): SignupErrors {
    const displayNameErrors: string[] = [];
    const emailErrors: string[] = [];
    const passwordErrors: string[] = [];
    const battletagErrors: string[] = [];
    const whatsappErrors: string[] = [];

    if (!value.displayName.trim()) {
      displayNameErrors.push('Informe o nome de exibição.');
    }

    if (!value.email.trim()) {
      emailErrors.push('Informe o email.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
      emailErrors.push('Informe um email válido.');
    }

    if (!value.password) {
      passwordErrors.push('Informe a senha.');
    } else if (value.password.length < 8) {
      passwordErrors.push('A senha deve ter ao menos 8 caracteres.');
    }

    if (!value.battletag.trim()) {
      battletagErrors.push('Informe a BattleTag.');
    }

    if (!value.whatsapp.trim()) {
      whatsappErrors.push('Informe seu whatsapp.');
    }

    return {
      displayName: displayNameErrors,
      email: emailErrors,
      password: passwordErrors,
      battletag: battletagErrors,
      whatsapp: whatsappErrors,
    };
  }

  private validateLogin(value: LoginFormValue): LoginErrors {
    const emailErrors: string[] = [];
    const passwordErrors: string[] = [];

    if (!value.email.trim()) {
      emailErrors.push('Informe o email.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
      emailErrors.push('Informe um email válido.');
    }

    if (!value.password) {
      passwordErrors.push('Informe a senha.');
    } else if (value.password.length < 8) {
      passwordErrors.push('A senha deve ter ao menos 8 caracteres.');
    }

    return {
      email: emailErrors,
      password: passwordErrors,
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

    return 'Não foi possível realizar o login.';
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

    return 'Não foi possível realizar o cadastro.';
  }

  private async navigateAfterAuthentication(): Promise<void> {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    if (!redirect || !this.isSafeInternalPath(redirect)) {
      await this.router.navigateByUrl('/watchpoint');
      return;
    }

    await this.router.navigateByUrl(redirect);
  }

  private isSafeInternalPath(path: string): boolean {
    return path.startsWith('/') && !path.startsWith('//');
  }
}
