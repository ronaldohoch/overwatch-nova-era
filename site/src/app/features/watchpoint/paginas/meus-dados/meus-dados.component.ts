import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService, type AuthUser } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';

const PROFILE_FIELDS = ['displayName', 'email', 'whatsapp'] as const;
const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const;

type ProfileField = (typeof PROFILE_FIELDS)[number];
type PasswordField = (typeof PASSWORD_FIELDS)[number];
type SubmitStatus = 'success' | 'error';

type ProfileFormValue = Readonly<{
  displayName: string;
  email: string;
  whatsapp: string;
}>;

type PasswordFormValue = Readonly<{
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}>;

type ProfileErrors = Readonly<Record<ProfileField, string[]>>;
type PasswordErrors = Readonly<Record<PasswordField, string[]>>;

@Component({
  selector: 'app-meus-dados',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  templateUrl: './meus-dados.component.html',
  styleUrl: './meus-dados.component.css',
})
export class MeusDadosComponent {
  readonly auth = inject(AuthService);

  readonly profileForm = signal<ProfileFormValue>({
    displayName: '',
    email: '',
    whatsapp: '',
  });

  readonly passwordForm = signal<PasswordFormValue>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  readonly profileTouched = signal<Record<ProfileField, boolean>>({
    displayName: false,
    email: false,
    whatsapp: false,
  });

  readonly passwordTouched = signal<Record<PasswordField, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  readonly profileSubmitted = signal(false);
  readonly passwordSubmitted = signal(false);

  readonly profileMessage = signal<string | null>(null);
  readonly passwordMessage = signal<string | null>(null);
  readonly profileStatus = signal<SubmitStatus | null>(null);
  readonly passwordStatus = signal<SubmitStatus | null>(null);
  readonly profilePending = signal(false);
  readonly passwordPending = signal(false);

  readonly profileErrors = computed<ProfileErrors>(() => this.validateProfile(this.profileForm()));
  readonly passwordErrors = computed<PasswordErrors>(() => this.validatePassword(this.passwordForm()));

  readonly profileHasErrors = computed(() =>
    PROFILE_FIELDS.some((field) => this.profileErrors()[field].length > 0),
  );
  readonly passwordHasErrors = computed(() =>
    PASSWORD_FIELDS.some((field) => this.passwordErrors()[field].length > 0),
  );

  readonly canSubmitProfile = computed(() => this.auth.isAuthenticated() && !this.profileHasErrors());
  readonly canSubmitPassword = computed(() => this.auth.isAuthenticated() && !this.passwordHasErrors());
  readonly readonlyBattletag = computed(() => {
    const user = this.auth.user();
    return user ? this.readUserString(user, 'battletag') : '';
  });

  constructor() {
    this.prefillFormFromUser();
  }

  updateProfileField(field: ProfileField, value: string): void {
    this.profileForm.update((current) => ({ ...current, [field]: value }));
  }

  updatePasswordField(field: PasswordField, value: string): void {
    this.passwordForm.update((current) => ({ ...current, [field]: value }));
  }

  markProfileTouched(field: ProfileField): void {
    this.profileTouched.update((current) => ({ ...current, [field]: true }));
  }

  markPasswordTouched(field: PasswordField): void {
    this.passwordTouched.update((current) => ({ ...current, [field]: true }));
  }

  profileFieldError(field: ProfileField): string | null {
    const show = this.profileSubmitted() || this.profileTouched()[field];
    if (!show) return null;

    const [firstError] = this.profileErrors()[field];
    return firstError ?? null;
  }

  passwordFieldError(field: PasswordField): string | null {
    const show = this.passwordSubmitted() || this.passwordTouched()[field];
    if (!show) return null;

    const [firstError] = this.passwordErrors()[field];
    return firstError ?? null;
  }

  async onUpdate(event: Event): Promise<void> {
    event.preventDefault();
    this.profileSubmitted.set(true);
    this.profileMessage.set(null);
    this.profileStatus.set(null);

    if (!this.auth.isAuthenticated()) {
      this.profileMessage.set('Sua sessão expirou. Faça login novamente.');
      this.profileStatus.set('error');
      return;
    }

    if (!this.canSubmitProfile()) return;

    this.profilePending.set(true);

    try {
      await this.auth.updateCurrentUser({
        displayName: this.profileForm().displayName,
        email: this.profileForm().email,
        whatsapp: this.profileForm().whatsapp,
      });

      this.profileMessage.set('Dados atualizados com sucesso.');
      this.profileStatus.set('success');
    } catch (error: unknown) {
      this.profileMessage.set(this.resolveError(error, 'Não foi possível atualizar seus dados.'));
      this.profileStatus.set('error');
    } finally {
      this.profilePending.set(false);
    }
  }

  async onChangePassword(event: Event): Promise<void> {
    event.preventDefault();
    this.passwordSubmitted.set(true);
    this.passwordMessage.set(null);
    this.passwordStatus.set(null);

    if (!this.auth.isAuthenticated()) {
      this.passwordMessage.set('Sua sessão expirou. Faça login novamente.');
      this.passwordStatus.set('error');
      return;
    }

    if (!this.canSubmitPassword()) return;

    this.passwordPending.set(true);

    try {
      await this.auth.changeCurrentUserPassword({
        currentPassword: this.passwordForm().currentPassword,
        newPassword: this.passwordForm().newPassword,
      });

      this.resetPasswordForm();
      this.passwordMessage.set('Senha alterada com sucesso.');
      this.passwordStatus.set('success');
    } catch (error: unknown) {
      this.passwordMessage.set(this.resolveError(error, 'Não foi possível alterar sua senha.'));
      this.passwordStatus.set('error');
    } finally {
      this.passwordPending.set(false);
    }
  }

  private resetPasswordForm(): void {
    this.passwordForm.set({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    this.passwordTouched.set({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
    this.passwordSubmitted.set(false);
  }

  private prefillFormFromUser(): void {
    const user = this.auth.user();
    if (!user) return;

    this.profileForm.set({
      displayName: this.readUserString(user, 'displayName'),
      email: this.readUserString(user, 'email'),
      whatsapp: this.readUserString(user, 'whatsapp'),
    });
  }

  private readUserString(user: AuthUser, field: string): string {
    const value = user[field];
    return typeof value === 'string' ? value : '';
  }

  private validateProfile(value: ProfileFormValue): ProfileErrors {
    const displayNameErrors: string[] = [];
    const emailErrors: string[] = [];
    const whatsappErrors: string[] = [];

    if (!value.displayName.trim()) {
      displayNameErrors.push('Informe o nome de exibição.');
    }

    if (!value.email.trim()) {
      emailErrors.push('Informe o email.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
      emailErrors.push('Informe um email válido.');
    }

    if (!value.whatsapp.trim()) {
      whatsappErrors.push('Informe seu whatsapp.');
    }

    return {
      displayName: displayNameErrors,
      email: emailErrors,
      whatsapp: whatsappErrors,
    };
  }

  private validatePassword(value: PasswordFormValue): PasswordErrors {
    const currentPasswordErrors: string[] = [];
    const newPasswordErrors: string[] = [];
    const confirmPasswordErrors: string[] = [];

    if (!value.currentPassword) {
      currentPasswordErrors.push('Informe sua senha atual.');
    }

    if (!value.newPassword) {
      newPasswordErrors.push('Informe a nova senha.');
    } else if (value.newPassword.length < 8) {
      newPasswordErrors.push('A nova senha deve ter ao menos 8 caracteres.');
    }

    if (value.currentPassword && value.newPassword && value.currentPassword === value.newPassword) {
      newPasswordErrors.push('A nova senha deve ser diferente da senha atual.');
    }

    if (!value.confirmPassword) {
      confirmPasswordErrors.push('Confirme a nova senha.');
    } else if (value.confirmPassword !== value.newPassword) {
      confirmPasswordErrors.push('As senhas não conferem.');
    }

    return {
      currentPassword: currentPasswordErrors,
      newPassword: newPasswordErrors,
      confirmPassword: confirmPasswordErrors,
    };
  }

  private resolveError(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage =
        typeof error.error?.error === 'string' ? error.error.error : null;

      if (backendMessage) return backendMessage;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }
}
