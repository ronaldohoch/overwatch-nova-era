import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DoubleEliminationComponent } from '../brackets/double-elimination/double-elimination.component';
import { Bracket } from '../brackets/brackets.service';
import { TeamDisplay } from '../components/match-card/match-card.component';

type PageState = 'loading' | 'loaded' | 'no-bracket' | 'not-found' | 'error';
type RawRecord = Readonly<Record<string, unknown>>;

interface TournamentInfo {
  readonly name: string;
  readonly status: string;
  readonly description: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Inscrições abertas',
  checkin: 'Check-in',
  locked: 'Bloqueado',
  running: 'Em andamento',
  finished: 'Finalizado',
  canceled: 'Cancelado',
};

@Component({
  selector: 'app-torneio-detalhe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DoubleEliminationComponent],
  templateUrl: './torneio-detalhe.component.html',
})
export class TorneioDetalheComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly tournamentId = this.route.snapshot.paramMap.get('id')?.trim() || null;

  readonly state = signal<PageState>('loading');
  readonly tournament = signal<TournamentInfo | null>(null);
  readonly bracket = signal<Bracket | null>(null);
  readonly teams = signal<Record<string, TeamDisplay>>({});
  readonly errorMessage = signal<string | null>(null);

  readonly statusLabel = computed(() => {
    const s = this.tournament()?.status ?? '';
    return STATUS_LABELS[s] ?? s;
  });

  readonly statusClass = computed(() => {
    const s = this.tournament()?.status ?? '';
    if (s === 'running') return 'bg-[rgba(240,99,20,0.12)] text-(--ow-orange) border border-(--ow-orange)';
    if (s === 'finished') return 'bg-[rgba(34,197,94,0.1)] text-(--ow-green) border border-(--ow-green)';
    if (s === 'canceled') return 'bg-[rgba(239,68,68,0.1)] text-red-500 border border-red-400';
    return 'bg-(--ow-gray-100) text-(--ow-gray-600) border border-(--ow-gray-300)';
  });

  constructor() {
    if (this.tournamentId) {
      void this.loadAll(this.tournamentId);
    } else {
      this.errorMessage.set('ID do torneio não informado.');
      this.state.set('error');
    }
  }

  // ── Privados ──────────────────────────────────────────────

  private async loadAll(id: string): Promise<void> {
    this.state.set('loading');

    const [tournamentOk] = await Promise.all([
      this.loadTournamentInfo(id),
      this.loadBracket(id),
    ]);

    if (!tournamentOk) {
      this.state.set('not-found');
      return;
    }

    const b = this.bracket();
    if (b) {
      this.buildTeamsFromBracket(b);
      this.state.set('loaded');
    } else {
      this.state.set('no-bracket');
    }
  }

  /** Carrega info do torneio. Retorna false se não encontrado. */
  private async loadTournamentInfo(id: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${environment.apiURLTorneios}/${id}`),
      );
      if (this.isRecord(response)) {
        this.tournament.set({
          name: this.readString(response, 'name') ?? 'Torneio sem nome',
          status: this.readString(response, 'status') ?? '',
          description: this.readString(response, 'description'),
        });
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 404) return false;
      return true; // erros não-404 não bloqueiam a página
    }
  }

  /** Carrega o bracket. Silencia 404 (torneio sem chave ainda). */
  private async loadBracket(id: string): Promise<void> {
    try {
      const bracket = await firstValueFrom(
        this.http.get<Bracket>(`${environment.apiURLBrackets}/${id}`),
      );
      this.bracket.set(bracket);
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.bracket.set(null); // sem chave — ok
      }
      // outros erros: ignora, o bracket fica null
    }
  }

  /**
   * Constrói o mapa id → TeamDisplay a partir do teamInfo embutido no bracket.
   * Não requer nenhuma chamada adicional à API — disponível sem autenticação.
   */
  private buildTeamsFromBracket(bracket: Bracket): void {
    const info = bracket.teamInfo;
    if (!info) return;

    const map: Record<string, TeamDisplay> = {};
    for (const [id, team] of Object.entries(info)) {
      map[id] = { id, name: team.name, logoUrl: team.logoUrl };
    }
    this.teams.set(map);
  }

  // ── Utilitários de parsing ─────────────────────────────────

  private isRecord(value: unknown): value is RawRecord {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;
    const n = raw.trim();
    return n || null;
  }
}
