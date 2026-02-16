import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ButtonsComponent } from '../../shared/buttons/buttons';

type SignupField = 'displayName' | 'email' | 'password' | 'battletag';

type SignupFormValue = Readonly<{
  displayName: string;
  email: string;
  password: string;
  battletag: string;
}>;

type SignupErrors = Readonly<Record<SignupField, string[]>>;

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
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

  readonly errors = computed<SignupErrors>(() => this.validate(this.form()));
  readonly hasErrors = computed(() =>
    Object.values(this.errors()).some((messages) => messages.length > 0),
  );
  readonly canSubmit = computed(() => !this.hasErrors());

  isLogin = signal<boolean>(false)

  toggleLogin(){
    this.isLogin.update(val=>!val)
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

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted.set(true);
    this.submitMessage.set(null);

    if (!this.canSubmit()) return;

    this.submitMessage.set('Cadastro preenchido com sucesso. Integração com API pendente.');
  }

  private validate(value: SignupFormValue): SignupErrors {
    const displayNameErrors: string[] = [];
    const emailErrors: string[] = [];
    const passwordErrors: string[] = [];
    const battletagErrors: string[] = [];

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
    } else if (!/^[A-Za-z0-9_]{3,16}#[0-9]{4,6}$/.test(value.battletag)) {
      battletagErrors.push('Use o formato Nome#1234.');
    }

    return {
      displayName: displayNameErrors,
      email: emailErrors,
      password: passwordErrors,
      battletag: battletagErrors,
    };
  }

}
