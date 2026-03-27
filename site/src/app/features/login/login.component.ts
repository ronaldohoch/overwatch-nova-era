import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ButtonsComponent } from '../../shared/buttons/buttons';
import { ModalService } from '../../shared/modal/modal.service';
import { ModalHostComponent } from '../../shared/modal/modal-host.component';
import { RecuperarSenhaComponent } from './components/recuperar-senha/recuperar-senha.component';
import { InputComponent, OwInputState } from '../../shared/design-system/input/input.component';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, ModalHostComponent, ReactiveFormsModule, InputComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modal = inject(ModalService);

  readonly signupGroup = new FormGroup({
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
    battletag: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    whatsapp: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly loginGroup = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
  });

  readonly signupSubmitted = signal(false);
  readonly loginSubmitted = signal(false);
  readonly signupMessage = signal<string | null>(null);
  readonly loginMessage = signal<string | null>(null);
  readonly signupStatus = signal<'success' | 'error' | null>(null);
  readonly loginStatus = signal<'success' | 'error' | null>(null);
  readonly signupPending = signal(false);
  readonly loginPending = signal(false);

  openRecuperarSenha(): void {
    this.modal.open(RecuperarSenhaComponent);
  }

  fieldState(control: FormControl, submitted: boolean): OwInputState {
    return control.invalid && (control.touched || submitted) ? 'error' : 'default';
  }

  fieldError(control: FormControl, submitted: boolean, label: string): string | undefined {
    if (!control.invalid || (!control.touched && !submitted)) return undefined;
    if (control.hasError('required')) return `Informe ${label}.`;
    if (control.hasError('email')) return 'Informe um e-mail válido.';
    if (control.hasError('minlength')) {
      return `Deve ter ao menos ${control.getError('minlength').requiredLength} caracteres.`;
    }
    return undefined;
  }

  async onCreate(event: Event): Promise<void> {
    event.preventDefault();
    this.signupSubmitted.set(true);
    this.signupMessage.set(null);
    this.signupStatus.set(null);

    if (this.signupGroup.invalid) return;

    this.signupPending.set(true);

    try {
      const { displayName, email, password, battletag, whatsapp } = this.signupGroup.getRawValue();
      await this.auth.create({ displayName, email, password, battletag, whatsapp });
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

    if (this.loginGroup.invalid) return;

    this.loginPending.set(true);

    try {
      const { email, password } = this.loginGroup.getRawValue();
      await this.auth.login({ email, password });
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

  private resolveLoginError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = typeof error.error?.error === 'string' ? error.error.error : null;
      if (backendMessage) return backendMessage;
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return 'Não foi possível realizar o login.';
  }

  private resolveCreateError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = typeof error.error?.error === 'string' ? error.error.error : null;
      if (backendMessage) return backendMessage;
    }
    if (error instanceof Error && error.message.trim()) return error.message;
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
