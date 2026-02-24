import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';

type RawRecord = Readonly<Record<string, unknown>>;
type TrophyTarget = 'user' | 'team' | 'both';
type AwardTargetType = 'user' | 'team';
type SubmitStatus = 'success' | 'error';

type TrophyCatalogItem = Readonly<{
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  target: TrophyTarget;
  targetLabel: string;
  active: boolean;
  automationEvent: string | null;
  automationEnabled: boolean;
}>;

type CreateFormValue = Readonly<{
  name: string;
  code: string;
  description: string;
  icon: string;
  target: TrophyTarget;
  active: boolean;
  automationEnabled: boolean;
  automationEvent: string;
}>;

type AwardFormValue = Readonly<{
  trophyId: string;
  targetType: AwardTargetType;
  targetIdentifier: string;
  reason: string;
}>;

@Component({
  selector: 'app-trofeus',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, CardComponent],
  templateUrl: './trofeus.component.html',
  styleUrl: './trofeus.component.css',
})
export class TrofeusComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  private readonly trofeusApiUrl = `${environment.apiURLTrofeus}`;

  readonly loading = signal(false);
  readonly loadingMessage = signal<string | null>(null);
  readonly catalog = signal<readonly TrophyCatalogItem[]>([]);

  readonly creating = signal(false);
  readonly createStatus = signal<SubmitStatus | null>(null);
  readonly createMessage = signal<string | null>(null);

  readonly awarding = signal(false);
  readonly awardStatus = signal<SubmitStatus | null>(null);
  readonly awardMessage = signal<string | null>(null);

  readonly createForm = signal<CreateFormValue>({
    name: '',
    code: '',
    description: '',
    icon: '🏅',
    target: 'both',
    active: true,
    automationEnabled: false,
    automationEvent: '',
  });

  readonly awardForm = signal<AwardFormValue>({
    trophyId: '',
    targetType: 'user',
    targetIdentifier: '',
    reason: '',
  });

  readonly canCreateCatalog = computed(() => this.auth.userRole() === 'admin');
  readonly canAward = computed(() => {
    const role = this.auth.userRole();
    return role === 'admin' || role === 'streamer';
  });

  readonly availableAutomationEvents = [
    { value: '', label: 'Sem automacao' },
    { value: 'tournament_random_checkin', label: 'Check-in random' },
    { value: 'tournament_closed_team_checkin', label: 'Check-in time fechado' },
  ] as const;

  readonly targetIdentifierLabel = computed(() =>
    this.awardForm().targetType === 'user'
      ? 'Battletag do usuario'
      : 'ID do time',
  );

  readonly targetIdentifierPlaceholder = computed(() =>
    this.awardForm().targetType === 'user'
      ? 'Ex: Jogador#1234'
      : 'Ex: ID do time no sistema',
  );

  constructor() {
    this.applyAwardPrefillFromRouteParams(this.route.snapshot.paramMap);
    this.applyAwardPrefillFromQueryParams(this.route.snapshot.queryParamMap);
    void this.loadCatalog();
  }

  updateCreateField<K extends keyof CreateFormValue>(field: K, value: CreateFormValue[K]): void {
    this.createForm.update((current) => ({ ...current, [field]: value }));
  }

  updateAwardField<K extends keyof AwardFormValue>(field: K, value: AwardFormValue[K]): void {
    this.awardForm.update((current) => ({ ...current, [field]: value }));
  }

  async loadCatalog(): Promise<void> {
    this.loading.set(true);
    this.loadingMessage.set(null);

    try {
      const response = await firstValueFrom(this.http.get<unknown>(this.trofeusApiUrl));
      const catalog = this.readCatalog(response)
        .map((item) => this.toCatalogItem(item))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      this.catalog.set(catalog);
      if (!this.awardForm().trophyId && catalog.length > 0) {
        this.updateAwardField('trophyId', catalog[0].id);
      }
    } catch (error: unknown) {
      this.catalog.set([]);
      this.loadingMessage.set(this.resolveError(error, 'Nao foi possivel carregar os trofeus.'));
    } finally {
      this.loading.set(false);
    }
  }

  async onCreateTrophy(event: Event): Promise<void> {
    event.preventDefault();
    this.createStatus.set(null);
    this.createMessage.set(null);

    if (!this.canCreateCatalog()) {
      this.createStatus.set('error');
      this.createMessage.set('Apenas admin pode cadastrar trofeus.');
      return;
    }

    const form = this.createForm();
    const name = form.name.trim();
    if (!name) {
      this.createStatus.set('error');
      this.createMessage.set('Informe o nome do trofeu.');
      return;
    }

    if (form.automationEnabled && !form.automationEvent.trim()) {
      this.createStatus.set('error');
      this.createMessage.set('Selecione um evento para automacao.');
      return;
    }

    this.creating.set(true);

    try {
      await firstValueFrom(
        this.http.post(this.trofeusApiUrl, {
          name,
          code: form.code.trim() || undefined,
          description: form.description.trim() || undefined,
          icon: form.icon.trim() || undefined,
          target: form.target,
          active: form.active,
          automation: form.automationEnabled
            ? {
                enabled: true,
                event: form.automationEvent.trim(),
              }
            : {
                enabled: false,
                event: null,
              },
        }),
      );

      this.createStatus.set('success');
      this.createMessage.set('Trofeu cadastrado com sucesso.');
      this.createForm.set({
        name: '',
        code: '',
        description: '',
        icon: '🏅',
        target: 'both',
        active: true,
        automationEnabled: false,
        automationEvent: '',
      });
      await this.loadCatalog();
    } catch (error: unknown) {
      this.createStatus.set('error');
      this.createMessage.set(this.resolveError(error, 'Nao foi possivel cadastrar o trofeu.'));
    } finally {
      this.creating.set(false);
    }
  }

  async onAwardTrophy(event: Event): Promise<void> {
    event.preventDefault();
    this.awardStatus.set(null);
    this.awardMessage.set(null);

    if (!this.canAward()) {
      this.awardStatus.set('error');
      this.awardMessage.set('Apenas admin ou streamer pode conceder trofeus.');
      return;
    }

    const form = this.awardForm();
    if (!form.trophyId.trim()) {
      this.awardStatus.set('error');
      this.awardMessage.set('Selecione um trofeu.');
      return;
    }

    if (!form.targetIdentifier.trim()) {
      this.awardStatus.set('error');
      this.awardMessage.set('Informe o alvo para concessao.');
      return;
    }

    this.awarding.set(true);

    try {
      const payload =
        form.targetType === 'user'
          ? {
              trophyId: form.trophyId,
              targetType: 'user',
              battletag: form.targetIdentifier.trim(),
              reason: form.reason.trim() || undefined,
            }
          : {
              trophyId: form.trophyId,
              targetType: 'team',
              teamId: form.targetIdentifier.trim(),
              reason: form.reason.trim() || undefined,
            };

      const response = await firstValueFrom(
        this.http.post<unknown>(`${this.trofeusApiUrl}/award`, payload),
      );

      const result = this.readRecord(response);
      const alreadyAssigned = result ? this.readBoolean(result['alreadyAssigned']) : false;

      this.awardStatus.set('success');
      this.awardMessage.set(
        alreadyAssigned
          ? 'Este trofeu ja estava concedido para o alvo informado.'
          : 'Trofeu concedido com sucesso.',
      );
      this.updateAwardField('targetIdentifier', '');
      this.updateAwardField('reason', '');
      await this.loadCatalog();
    } catch (error: unknown) {
      this.awardStatus.set('error');
      this.awardMessage.set(this.resolveError(error, 'Nao foi possivel conceder o trofeu.'));
    } finally {
      this.awarding.set(false);
    }
  }

  private readCatalog(value: unknown): readonly RawRecord[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is RawRecord => this.isRecord(item));
    }

    if (!this.isRecord(value)) return [];

    for (const key of ['data', 'items', 'results', 'trophies', 'catalog']) {
      const nested = value[key];
      if (!Array.isArray(nested)) continue;
      return nested.filter((item): item is RawRecord => this.isRecord(item));
    }

    return [];
  }

  private toCatalogItem(value: RawRecord): TrophyCatalogItem {
    const target = this.readTarget(value['target']);
    const automation = this.readRecord(value['automation']);

    return {
      id: this.readString(value, 'id') ?? '',
      code: this.readString(value, 'code') ?? '',
      name: this.readString(value, 'name') ?? 'Trofeu',
      description: this.readString(value, 'description'),
      icon: this.readString(value, 'icon') ?? '🏅',
      target,
      targetLabel: this.toTargetLabel(target),
      active: this.readBoolean(value['active']),
      automationEnabled: automation ? this.readBoolean(automation['enabled']) : false,
      automationEvent: automation ? this.readString(automation, 'event') : null,
    };
  }

  private readTarget(value: unknown): TrophyTarget {
    if (value === 'user' || value === 'team' || value === 'both') return value;
    return 'both';
  }

  private toTargetLabel(value: TrophyTarget): string {
    if (value === 'user') return 'Usuarios';
    if (value === 'team') return 'Times';
    return 'Usuarios e times';
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized || null;
  }

  private readBoolean(value: unknown): boolean {
    return value === true;
  }

  private readRecord(value: unknown): RawRecord | null {
    return this.isRecord(value) ? value : null;
  }

  private isRecord(value: unknown): value is RawRecord {
    return !!value && typeof value === 'object' && !Array.isArray(value);
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

  private applyAwardPrefillFromQueryParams(queryParams: ParamMap): void {
    const targetTypeParam = (queryParams.get('targetType') ?? '').trim().toLowerCase();
    const trophyIdParam = (queryParams.get('trophyId') ?? '').trim();
    const targetIdentifierParam = (queryParams.get('targetIdentifier') ?? '').trim();
    const teamIdParam = (queryParams.get('teamId') ?? '').trim();
    const battletagParam = (queryParams.get('battletag') ?? '').trim();

    if (targetTypeParam === 'team') {
      this.updateAwardField('targetType', 'team');
    } else if (targetTypeParam === 'user') {
      this.updateAwardField('targetType', 'user');
    }

    if (trophyIdParam) {
      this.updateAwardField('trophyId', trophyIdParam);
    }

    const effectiveTargetType =
      targetTypeParam === 'team' || targetTypeParam === 'user'
        ? (targetTypeParam as AwardTargetType)
        : this.awardForm().targetType;

    const resolvedIdentifier =
      effectiveTargetType === 'team'
        ? teamIdParam || targetIdentifierParam
        : battletagParam || targetIdentifierParam;

    if (resolvedIdentifier) {
      this.updateAwardField('targetIdentifier', resolvedIdentifier);
    }
  }

  private applyAwardPrefillFromRouteParams(routeParams: ParamMap): void {
    const teamIdParam = (routeParams.get('teamId') ?? '').trim();
    if (!teamIdParam) return;

    this.updateAwardField('targetType', 'team');
    this.updateAwardField('targetIdentifier', teamIdParam);
  }
}
