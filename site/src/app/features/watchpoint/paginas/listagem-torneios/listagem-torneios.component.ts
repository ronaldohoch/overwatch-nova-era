import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { ListItemComponent, OwScheduleStatus } from '../../../../shared/list-item/list-item.component';

type RawRecord = Readonly<Record<string, unknown>>;

type TournamentListItem = Readonly<{
  trackKey: string;
  id: string;
  name: string;
  teamMode: string;
  startAtTimestamp: number;
  stageLabel: string;
  timeLabel: string;
  dateLabel: string;
  statusVariant: OwScheduleStatus;
  statusLabel: string;
}>;

@Component({
  selector: 'app-listagem-torneios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListItemComponent, ButtonsComponent],
  templateUrl: './listagem-torneios.component.html',
  styleUrl: './listagem-torneios.component.css',
})
export class ListagemTorneiosComponent {
  private readonly http = inject(HttpClient);
  private readonly torneiosApiUrl = `${environment.apiURLTorneios}`;

  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly tournaments = signal<readonly TournamentListItem[]>([]);

  constructor() {
    void this.loadTournaments();
  }

  async loadTournaments(): Promise<void> {
    this.loading.set(true);
    this.message.set(null);

    try {
      const response = await firstValueFrom(this.http.get<unknown>(this.torneiosApiUrl));
      const tournaments = this
        .readTournaments(response)
        .map((item) => this.toTournamentListItem(item))
        .sort((a, b) => a.startAtTimestamp - b.startAtTimestamp);

      this.tournaments.set(tournaments);
    } catch (error: unknown) {
      this.tournaments.set([]);
      this.message.set(this.resolveError(error, 'Nao foi possivel carregar os torneios.'));
    } finally {
      this.loading.set(false);
    }
  }

  private readTournaments(value: unknown): readonly RawRecord[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is RawRecord => this.isRecord(item));
    }

    if (!this.isRecord(value)) return [];

    for (const key of ['data', 'items', 'results', 'tournaments']) {
      const maybeArray = value[key];
      if (!Array.isArray(maybeArray)) continue;

      return maybeArray.filter((item): item is RawRecord => this.isRecord(item));
    }

    return [];
  }

  private toTournamentListItem(value: RawRecord): TournamentListItem {
    const id = this.readString(value, 'id') ?? '';
    const name = this.readString(value, 'name') ?? 'Torneio sem nome';
    const teamMode = (this.readString(value, 'teamMode') ?? '').toLowerCase();
    const status = (this.readString(value, 'status') ?? '').toLowerCase();
    const startAt = this.readString(value, 'startAt');
    const format = this.readString(value, 'format');
    const maxTeams = this.readNumber(value, 'maxTeams');

    return {
      trackKey: id || `${name}-${startAt ?? 'sem-data'}`,
      id,
      name,
      teamMode,
      startAtTimestamp: this.toStartTimestamp(startAt),
      stageLabel: this.buildStageLabel(teamMode, format, maxTeams),
      timeLabel: this.toTimeLabel(startAt),
      dateLabel: this.toDateLabel(startAt),
      statusVariant: this.toStatusVariant(status),
      statusLabel: this.toStatusLabel(status),
    };
  }

  private buildStageLabel(teamMode: string, format: string | null, maxTeams: number | null): string {
    const modeLabel =
      teamMode === 'random'
        ? 'Times sorteados'
        : teamMode === 'closed'
          ? 'Times fechados'
          : 'Modo desconhecido';

    const teamsLabel = maxTeams && maxTeams > 0 ? `${maxTeams} times` : 'Times nao informados';
    const formatLabel = format ? format.replaceAll('_', ' ').toUpperCase() : 'FORMATO NAO INFORMADO';

    return `${modeLabel} • ${teamsLabel} • ${formatLabel}`;
  }

  private toTimeLabel(value: string | null): string {
    if (!value) return '--:--';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '--:--';

    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed);
  }

  private toDateLabel(value: string | null): string {
    if (!value) return 'Data nao informada';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Data invalida';

    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(parsed);
  }

  private toStartTimestamp(value: string | null): number {
    if (!value) return Number.MAX_SAFE_INTEGER;

    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
  }

  private toStatusVariant(status: string): OwScheduleStatus {
    if (status === 'running') return 'live';
    if (status === 'finished' || status === 'canceled') return 'finished';
    return 'upcoming';
  }

  private toStatusLabel(status: string): string {
    if (status === 'draft') return 'Rascunho';
    if (status === 'published') return 'Publicado';
    if (status === 'checkin') return 'Check-in aberto';
    if (status === 'locked') return 'Bloqueado';
    if (status === 'running') return 'Em andamento';
    if (status === 'finished') return 'Finalizado';
    if (status === 'canceled') return 'Cancelado';
    return 'Status desconhecido';
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
  }

  private readNumber(value: RawRecord, field: string): number | null {
    const raw = value[field];
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
    return raw;
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
}
