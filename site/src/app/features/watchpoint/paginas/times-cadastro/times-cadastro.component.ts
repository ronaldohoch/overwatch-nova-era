import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';

const TEAM_FIELDS = ['name', 'category'] as const;

type TeamField = (typeof TEAM_FIELDS)[number];
type TeamCategory = 'formed' | 'random';
type SubmitStatus = 'success' | 'error';

type TeamFormValue = Readonly<{
  name: string;
  category: TeamCategory;
}>;

type TeamErrors = Readonly<Record<TeamField, string[]>>;

type CreateTeamPayload = Readonly<{
  name: string;
  category: TeamCategory;
}>;

@Component({
  selector: 'app-times-cadastro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  templateUrl: './times-cadastro.component.html',
  styleUrl: './times-cadastro.component.css',
})
export class TimesCadastroComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  private readonly timesApiUrl = `${environment.apiURLTimes}`;

  readonly form = signal<TeamFormValue>({
    name: '',
    category: 'formed',
  });

  readonly touched = signal<Record<TeamField, boolean>>({
    name: false,
    category: false,
  });

  readonly submitted = signal(false);
  readonly pending = signal(false);
  readonly message = signal<string | null>(null);
  readonly status = signal<SubmitStatus | null>(null);
  readonly skipCreatorAsCaptain = signal(false);

  readonly pageTitle = 'Cadastrar time';
  readonly pageDescription = 'Crie um novo time para participar dos torneios da comunidade.';

  readonly canChooseRandomCategory = computed(() => {
    const role = this.auth.userRole();
    return role === 'admin' || role === 'streamer';
  });

  readonly effectiveCategory = computed<TeamCategory>(() => {
    if (!this.canChooseRandomCategory()) return 'formed';
    return this.form().category;
  });

  readonly errors = computed<TeamErrors>(() => this.validateForm(this.form()));
  readonly hasErrors = computed(() => TEAM_FIELDS.some((field) => this.errors()[field].length > 0));
  readonly canSubmit = computed(
    () => this.auth.isAuthenticated() && !this.pending() && !this.hasErrors(),
  );

  updateField(field: TeamField, value: string): void {
    if (field === 'category') {
      const nextCategory: TeamCategory = value === 'random' ? 'random' : 'formed';
      this.form.update((current) => ({ ...current, category: nextCategory }));
      return;
    }

    this.form.update((current) => ({ ...current, [field]: value }));
  }

  markTouched(field: TeamField): void {
    this.touched.update((current) => ({ ...current, [field]: true }));
  }

  updateSkipCreatorAsCaptain(value: boolean): void {
    this.skipCreatorAsCaptain.set(value);
  }

  fieldError(field: TeamField): string | null {
    const shouldShow = this.submitted() || this.touched()[field];
    if (!shouldShow) return null;

    const [firstError] = this.errors()[field];
    return firstError ?? null;
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    this.message.set(null);
    this.status.set(null);

    if (!this.auth.isAuthenticated()) {
      this.message.set('Sua sessao expirou. Faca login novamente.');
      this.status.set('error');
      return;
    }

    if (!this.canSubmit()) return;

    this.pending.set(true);

    try {
      const payload = this.toPayload(this.form());
      const created = await firstValueFrom(this.http.post<unknown>(this.timesApiUrl, payload));

      if (this.shouldSkipCreatorAsCaptain()) {
        const teamId = this.readCreatedTeamId(created);
        if (!teamId) {
          throw new Error('Nao foi possivel identificar o time criado para remover o capitao.');
        }

        await firstValueFrom(this.http.delete(`${this.timesApiUrl}/${teamId}/members/me`));
      }

      this.message.set(
        this.shouldSkipCreatorAsCaptain()
          ? 'Time cadastrado com sucesso sem capitao. Redirecionando para a lista...'
          : 'Time cadastrado com sucesso. Redirecionando para a lista...',
      );
      this.status.set('success');
      await this.router.navigateByUrl('/watchpoint/times');
    } catch (error: unknown) {
      this.message.set(this.resolveError(error, 'Nao foi possivel cadastrar o time.'));
      this.status.set('error');
    } finally {
      this.pending.set(false);
    }
  }

  private toPayload(value: TeamFormValue): CreateTeamPayload {
    return {
      name: value.name.trim(),
      category: this.canChooseRandomCategory() ? value.category : 'formed',
    };
  }

  private shouldSkipCreatorAsCaptain(): boolean {
    if (!this.canChooseRandomCategory()) return false;
    return this.skipCreatorAsCaptain();
  }

  private readCreatedTeamId(value: unknown): string | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

    const raw = value as Record<string, unknown>;
    for (const key of ['id', '_id', 'teamId']) {
      const candidate = raw[key];
      if (typeof candidate !== 'string') continue;

      const normalized = candidate.trim();
      if (normalized) return normalized;
    }

    return null;
  }

  private validateForm(value: TeamFormValue): TeamErrors {
    const nameErrors: string[] = [];
    const categoryErrors: string[] = [];

    const name = value.name.trim();
    if (!name) {
      nameErrors.push('Informe o nome do time.');
    } else if (name.length > 80) {
      nameErrors.push('Nome do time deve ter no maximo 80 caracteres.');
    }

    if (this.canChooseRandomCategory()) {
      if (value.category !== 'formed' && value.category !== 'random') {
        categoryErrors.push('Categoria do time invalida.');
      }
    } else if (value.category !== 'formed') {
      categoryErrors.push('Membro so pode criar time com participantes selecionados.');
    }

    return {
      name: nameErrors,
      category: categoryErrors,
    };
  }

  private resolveError(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage =
        typeof error.error?.message === 'string'
          ? error.error.message
          : typeof error.error?.error === 'string'
            ? error.error.error
            : null;

      if (backendMessage) return backendMessage;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }

}
