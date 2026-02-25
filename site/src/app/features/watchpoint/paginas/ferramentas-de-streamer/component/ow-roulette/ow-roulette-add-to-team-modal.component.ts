import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import { ButtonsComponent } from '../../../../../../shared/buttons/buttons';
import { ModalRef } from '../../../../../../shared/modal/modal-ref';
import { MODAL_DATA } from '../../../../../../shared/modal/modal.service';

type RawRecord = Readonly<Record<string, unknown>>;
type TeamCategory = 'formed' | 'random' | 'unknown';

type RouletteEntryData = Readonly<{
  id: string;
  name: string;
  battletag?: string | null;
  displayName?: string | null;
}>;

type AddToTeamModalData = Readonly<{
  entry?: RouletteEntryData;
}>;

type TeamOption = Readonly<{
  id: string;
  name: string;
  category: TeamCategory;
  membersCount: number;
}>;

@Component({
  selector: 'ow-roulette-add-to-team-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  template: `
    <section class="space-y-4">
      <header class="space-y-1">
        <h2 class="text-xl font-black text-(--ow-gray-900)">Adicionar ao time</h2>
        <p class="text-sm text-(--ow-gray-600)">
          Selecione um time para adicionar o membro sorteado.
        </p>
      </header>

      <div class="rounded-md border border-(--ow-gray-200) bg-white p-3 text-sm">
        <p class="font-semibold text-(--ow-gray-800)">Sorteado:</p>
        <p class="text-(--ow-gray-700)">{{ selectedName() }}</p>
        <p class="mt-1 text-xs text-(--ow-gray-500)">Battletag: {{ selectedBattletag() || 'não informada' }}</p>
      </div>

      @if (!hasIdentifierForAdd()) {
        <p class="text-sm font-medium text-red-600">
          Este sorteado não possui UID/Battletag valida para adicionar em time.
        </p>
      }

      @if (loadingTeams()) {
        <p class="text-sm text-(--ow-gray-600)">Carregando times...</p>
      } @else if (teams().length === 0) {
        <p class="text-sm text-(--ow-gray-600)">Nenhum time encontrado.</p>
      } @else {
        <div class="max-h-72 space-y-2 overflow-auto pr-1">
          @for (team of teams(); track team.id) {
            <button
              type="button"
              class="w-full rounded-md border border-(--ow-gray-200) bg-white p-3 text-left transition-colors hover:bg-(--ow-gray-50) disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="!hasIdentifierForAdd() || !!assigningTeamId()"
              (click)="addSelectedMemberToTeam(team)"
            >
              <p class="text-sm font-black uppercase text-(--ow-gray-900)">{{ team.name }}</p>
              <p class="mt-1 text-xs text-(--ow-gray-600)">
                {{ team.membersCount }}/8 membros. {{ toCategoryLabel(team.category) }}
              </p>
              @if (assigningTeamId() === team.id) {
                <p class="mt-1 text-xs font-semibold text-(--ow-orange)">Adicionando...</p>
              }
            </button>
          }
        </div>
      }

      @if (message(); as message) {
        <p class="text-sm font-medium" [class.text-red-600]="messageIsError()" [class.text-green-700]="!messageIsError()">
          {{ message }}
        </p>
      }

      <div class="flex justify-end">
        <ow-btn variant="secondary-mini" [disabled]="!!assigningTeamId()" (click)="close()">
          Fechar
        </ow-btn>
      </div>
    </section>
  `,
})
export class OwRouletteAddToTeamModalComponent {
  private readonly http = inject(HttpClient);
  private readonly modalRef = inject(ModalRef<unknown>);
  private readonly modalData = (inject(MODAL_DATA, { optional: true }) ?? {}) as AddToTeamModalData;
  private readonly timesApiUrl = `${environment.apiURLTimes}`;

  readonly loadingTeams = signal(false);
  readonly assigningTeamId = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly messageIsError = signal(false);
  readonly teams = signal<readonly TeamOption[]>([]);

  readonly entry = computed<RouletteEntryData | null>(() => {
    const incoming = this.modalData.entry;
    if (!incoming) return null;

    const id = typeof incoming.id === 'string' ? incoming.id.trim() : '';
    const name = typeof incoming.name === 'string' ? incoming.name.trim() : '';
    if (!name) return null;

    return {
      id,
      name,
      battletag:
        typeof incoming.battletag === 'string' && incoming.battletag.trim()
          ? incoming.battletag.trim()
          : null,
      displayName:
        typeof incoming.displayName === 'string' && incoming.displayName.trim()
          ? incoming.displayName.trim()
          : null,
    };
  });

  readonly selectedName = computed(() => this.entry()?.name ?? 'Jogador sorteado');
  readonly selectedBattletag = computed(() => this.resolveEntryBattletag(this.entry()));
  readonly hasIdentifierForAdd = computed(() => {
    const battletag = this.selectedBattletag();
    if (battletag) return true;

    const uid = this.resolveEntryUid(this.entry());
    return !!uid;
  });

  constructor() {
    void this.loadTeams();
  }

  async addSelectedMemberToTeam(team: TeamOption): Promise<void> {
    if (this.assigningTeamId()) return;

    const payload = this.resolveAddMemberPayload();
    if (!payload) {
      this.setMessage('Não foi possível identificar UID/Battletag para adicionar no time.', true);
      return;
    }

    this.assigningTeamId.set(team.id);
    this.setMessage(null, false);

    try {
      await firstValueFrom(
        this.http.post<unknown>(`${this.timesApiUrl}/${encodeURIComponent(team.id)}/members`, payload),
      );

      this.modalRef.close({
        assigned: true,
        teamId: team.id,
      });
    } catch (error: unknown) {
      this.setMessage(this.resolveError(error, 'Não foi possível adicionar o membro ao time.'), true);
    } finally {
      this.assigningTeamId.set(null);
    }
  }

  close(): void {
    this.modalRef.close(null);
  }

  toCategoryLabel(category: TeamCategory): string {
    if (category === 'formed') return 'Time com participantes selecionados';
    if (category === 'random') return 'Time com participantes sorteados';
    return 'Categoria não informada';
  }

  private async loadTeams(): Promise<void> {
    this.loadingTeams.set(true);
    this.setMessage(null, false);

    try {
      const response = await this.fetchTeamsResponse();
      const teams = this.readTeams(response)
        .map((item) => this.toTeamOption(item))
        .sort((a, b) => {
          if (a.category === 'formed' && b.category !== 'formed') return -1;
          if (a.category !== 'formed' && b.category === 'formed') return 1;
          return a.name.localeCompare(b.name, 'pt-BR');
        });

      this.teams.set(teams);
    } catch (error: unknown) {
      this.teams.set([]);
      this.setMessage(this.resolveError(error, 'Não foi possível carregar os times.'), true);
    } finally {
      this.loadingTeams.set(false);
    }
  }

  private async fetchTeamsResponse(): Promise<unknown> {
    try {
      return await firstValueFrom(this.http.get<unknown>(this.timesApiUrl));
    } catch (error: unknown) {
      if (!(error instanceof HttpErrorResponse) || error.status !== 403) {
        throw error;
      }

      return firstValueFrom(this.http.get<unknown>(`${this.timesApiUrl}/me`));
    }
  }

  private resolveAddMemberPayload(): { battletag: string } | { uid: string } | null {
    const battletag = this.selectedBattletag();
    if (battletag) return { battletag };

    const uid = this.resolveEntryUid(this.entry());
    if (uid) return { uid };

    return null;
  }

  private resolveEntryUid(entry: RouletteEntryData | null): string | null {
    if (!entry) return null;

    const uid = entry.id.trim();
    if (!uid) return null;

    const syntheticPrefixes = ['manual-', 'imported-', 'item-', 'checkin-'];
    if (syntheticPrefixes.some((prefix) => uid.startsWith(prefix))) return null;

    return uid;
  }

  private resolveEntryBattletag(entry: RouletteEntryData | null): string | null {
    if (!entry) return null;
    if (entry.battletag && entry.battletag.trim()) return entry.battletag.trim();

    const match = entry.name.match(/([^\s()]+#[0-9]{1,10})/);
    if (!match?.[1]) return null;

    const parsed = match[1].trim();
    return parsed || null;
  }

  private readTeams(value: unknown): readonly RawRecord[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is RawRecord => this.isRecord(item));
    }

    if (!this.isRecord(value)) return [];

    for (const key of ['teams', 'data', 'items', 'results', 'payload']) {
      const nested = value[key];
      if (!Array.isArray(nested)) continue;
      return nested.filter((item): item is RawRecord => this.isRecord(item));
    }

    return [];
  }

  private toTeamOption(value: RawRecord): TeamOption {
    const category = this.readCategory(value);

    return {
      id:
        this.readString(value, 'id') ??
        this.readString(value, '_id') ??
        this.readString(value, 'teamId') ??
        '',
      name: this.readString(value, 'name') ?? this.readString(value, 'teamName') ?? 'Time sem nome',
      category,
      membersCount: this.readInteger(
        value['membersCount'] ?? value['members_count'] ?? value['size'],
      ),
    };
  }

  private readCategory(value: RawRecord): TeamCategory {
    const raw = (
      this.readString(value, 'category') ??
      this.readString(value, 'teamCategory') ??
      ''
    ).toLowerCase();

    if (raw === 'formed') return 'formed';
    if (raw === 'random') return 'random';
    return 'unknown';
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized || null;
  }

  private readInteger(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.floor(value));
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value.trim(), 10);
      if (Number.isInteger(parsed)) return Math.max(0, parsed);
    }

    return 0;
  }

  private isRecord(value: unknown): value is RawRecord {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private setMessage(message: string | null, isError: boolean): void {
    this.message.set(message);
    this.messageIsError.set(!!message && isError);
  }

  private resolveError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage =
        typeof error.error?.message === 'string'
          ? error.error.message
          : typeof error.error?.error === 'string'
            ? error.error.error
            : null;
      if (backendMessage) return backendMessage;
    }

    if (error instanceof Error && error.message.trim()) return error.message;
    return fallback;
  }
}
