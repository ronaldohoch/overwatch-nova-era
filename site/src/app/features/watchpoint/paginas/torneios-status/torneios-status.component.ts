import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';
import { ToggleComponent } from '../../../../shared/design-system/toggle/toggle.component';

type TournamentStatus =
  | 'draft'
  | 'published'
  | 'checkin'
  | 'locked'
  | 'running'
  | 'finished'
  | 'canceled';
type SubmitStatus = 'success' | 'error';
type RawRecord = Readonly<Record<string, unknown>>;

type TournamentListItem = Readonly<{
  id: string;
  name: string;
  status: TournamentStatus | null;
  teamMode: string;
  startAt: string | null;
}>;

const ALL_STATUSES: readonly TournamentStatus[] = [
  'draft',
  'published',
  'checkin',
  'locked',
  'running',
  'finished',
  'canceled',
];

const STATUS_INFO: Readonly<Record<TournamentStatus, { label: string; description: string }>> = {
  draft: {
    label: 'Rascunho',
    description: 'Torneio criado mas não visível ao público. Ainda em configuração.',
  },
  published: {
    label: 'Publicado',
    description: 'Torneio visível ao público. Inscrições abertas para times e jogadores.',
  },
  checkin: {
    label: 'Check-in aberto',
    description: 'Período de confirmação de presença dos participantes inscritos.',
  },
  locked: {
    label: 'Bloqueado',
    description: 'Check-in encerrado. Times formados e aguardando início do torneio.',
  },
  running: {
    label: 'Em andamento',
    description: 'Torneio em andamento com partidas sendo disputadas.',
  },
  finished: {
    label: 'Finalizado',
    description: 'Torneio encerrado. Resultados finais registrados.',
  },
  canceled: {
    label: 'Cancelado',
    description: 'Torneio cancelado.',
  },
};

@Component({
  selector: 'app-torneios-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, CardComponent, ToggleComponent, FormsModule],
  templateUrl: './torneios-status.component.html',
  styleUrl: './torneios-status.component.css',
})
export class TorneiosStatusComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  private readonly torneiosApiUrl = `${environment.apiURLTorneios}`;
  private readonly routeTournamentId = this.readRouteTournamentId();

  readonly loadingTournamentDetails = signal(false);
  readonly pendingStatusChange = signal(false);

  readonly selectedTournament = signal<TournamentListItem | null>(null);
  readonly selectedNextStatus = signal<TournamentStatus | ''>('');

  readonly message = signal<string | null>(null);
  readonly messageStatus = signal<SubmitStatus | null>(null);

  readonly allStatuses = ALL_STATUSES;
  readonly statusInfo = STATUS_INFO;

  readonly hasAdminPermission = computed(() => this.auth.userRole() === 'admin');
  readonly hasTournamentRouteParam = computed(() => !!this.routeTournamentId);
  readonly currentStatus = computed<TournamentStatus | null>(
    () => this.selectedTournament()?.status ?? null,
  );
  readonly canSubmit = computed(() => {
    const nextStatus = this.selectedNextStatus();
    if (!this.auth.isAuthenticated() || !this.hasAdminPermission()) return false;
    if (!this.routeTournamentId || !nextStatus) return false;
    if (this.pendingStatusChange() || this.loadingTournamentDetails()) return false;
    if (nextStatus === this.currentStatus()) return false;
    return true;
  });

  constructor() {
    if (!this.routeTournamentId) {
      this.message.set(
        'ID do torneio não informado. Acesse esta tela pelo botao da listagem de torneios.',
      );
      this.messageStatus.set('error');
      return;
    }

    void this.loadTournamentDetails(this.routeTournamentId);
  }

  onToggleChange(status: TournamentStatus, isChecked: boolean): void {
    if (isChecked) {
      this.selectedNextStatus.set(status);
    } else if (this.selectedNextStatus() === status) {
      this.selectedNextStatus.set('');
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.message.set(null);
    this.messageStatus.set(null);

    if (!this.auth.isAuthenticated()) {
      this.message.set('Sua sessão expirou. Faça login novamente.');
      this.messageStatus.set('error');
      return;
    }

    if (!this.hasAdminPermission()) {
      this.message.set('Apenas administradores podem alterar status de torneio.');
      this.messageStatus.set('error');
      return;
    }

    const tournamentId = this.selectedTournament()?.id ?? this.routeTournamentId;
    const nextStatus = this.selectedNextStatus();
    if (!tournamentId || !nextStatus) {
      this.message.set('Selecione um novo status válido.');
      this.messageStatus.set('error');
      return;
    }

    if (nextStatus === this.currentStatus()) {
      this.message.set('O status selecionado é igual ao status atual.');
      this.messageStatus.set('error');
      return;
    }

    this.pendingStatusChange.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<unknown>(`${this.torneiosApiUrl}/${tournamentId}/status`, {
          status: nextStatus,
        }),
      );

      const updatedTournament = this.toTournamentListItemFromDetails(response, {
        id: tournamentId,
        name: this.selectedTournament()?.name ?? 'Torneio',
        status: nextStatus,
        teamMode: this.selectedTournament()?.teamMode ?? '',
        startAt: this.selectedTournament()?.startAt ?? null,
      });

      this.selectedTournament.set(updatedTournament);
      this.selectedNextStatus.set(nextStatus);

      this.message.set(`Status alterado para ${STATUS_INFO[nextStatus].label} com sucesso.`);
      this.messageStatus.set('success');
    } catch (error: unknown) {
      this.message.set(this.resolveError(error, 'Não foi possível alterar o status do torneio.'));
      this.messageStatus.set('error');
    } finally {
      this.pendingStatusChange.set(false);
    }
  }

  statusBadgeClass(status: TournamentStatus | null): string {
    const base =
      'inline-flex items-center rounded px-3 py-1 text-xs font-bold uppercase tracking-wider';

    if (status === 'running') return `${base} bg-[color:var(--ow-blue)] text-white`;
    if (status === 'finished') return `${base} bg-green-700 text-white`;
    if (status === 'canceled') return `${base} bg-red-600 text-white`;
    if (status === 'checkin') return `${base} bg-[color:var(--ow-orange)] text-white`;
    if (status === 'locked') return `${base} bg-[color:var(--ow-gray-700)] text-white`;
    if (status === 'published') return `${base} bg-[color:var(--ow-blue-dark)] text-white`;
    if (status === 'draft') return `${base} bg-[color:var(--ow-gray-500)] text-white`;

    return `${base} bg-[color:var(--ow-gray-400)] text-white`;
  }

  private async loadTournamentDetails(tournamentId: string): Promise<void> {
    this.loadingTournamentDetails.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${this.torneiosApiUrl}/${tournamentId}`),
      );

      const tournament = this.toTournamentListItemFromDetails(response, {
        id: tournamentId,
        name: 'Torneio',
        status: null,
        teamMode: '',
        startAt: null,
      });

      this.selectedTournament.set(tournament);
      this.selectedNextStatus.set(tournament.status ?? '');
    } catch (error: unknown) {
      this.selectedTournament.set(null);
      this.selectedNextStatus.set('');
      this.message.set(this.resolveError(error, 'Não foi possível carregar os dados do torneio.'));
      this.messageStatus.set('error');
    } finally {
      this.loadingTournamentDetails.set(false);
    }
  }

  private toTournamentListItemFromDetails(value: unknown, fallback: TournamentListItem): TournamentListItem {
    if (!this.isRecord(value)) return fallback;

    return {
      id: this.readString(value, 'id') ?? fallback.id,
      name: this.readString(value, 'name') ?? fallback.name,
      status: this.normalizeStatus(this.readString(value, 'status')) ?? fallback.status,
      teamMode: (this.readString(value, 'teamMode') ?? fallback.teamMode).toLowerCase(),
      startAt: this.readString(value, 'startAt') ?? fallback.startAt,
    };
  }

  private normalizeStatus(value: unknown): TournamentStatus | null {
    if (typeof value !== 'string') return null;

    const status = value.trim().toLowerCase();
    if (status === 'draft') return 'draft';
    if (status === 'published') return 'published';
    if (status === 'checkin') return 'checkin';
    if (status === 'locked') return 'locked';
    if (status === 'running') return 'running';
    if (status === 'finished') return 'finished';
    if (status === 'canceled') return 'canceled';

    return null;
  }

  private readRouteTournamentId(): string | null {
    const raw = this.route.snapshot.paramMap.get('id');
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized || null;
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
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
