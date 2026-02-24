import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { environment } from '../../../../../environments/environment';
import {
  OW_ROULETTE_ROUTE,
  OW_ROULETTE_SESSION_STORAGE_KEY,
  type OwRouletteListItem,
} from '../ferramentas-de-streamer/paginas/roleta/ow-roulette-session-storage';

type RoleFilter = 'all' | 'tank' | 'dps' | 'support';

type TournamentListItem = Readonly<{
  id: string;
  name: string;
  status: string;
  teamMode: string;
}>;

type CheckinListItem = Readonly<{
  id: string;
  uid: string;
  displayName: string;
  battletag: string;
  role: 'tank' | 'dps' | 'support' | 'unknown';
  checkedInAt: string | null;
  teamId: string | null;
}>;

type RawRecord = Readonly<Record<string, unknown>>;

@Component({
  selector: 'app-check-in-by-tournament',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  templateUrl: './check-in-by-tournament.component.html',
  styleUrl: './check-in-by-tournament.component.css',
})
export class CheckInByTournamentComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  readonly auth = inject(AuthService);
  private readonly torneiosApiUrl = `${environment.apiURLTorneios}`;
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly loadingTournaments = signal(false);
  readonly loadingCheckins = signal(false);
  readonly tournaments = signal<readonly TournamentListItem[]>([]);
  readonly selectedTournamentId = signal('');
  readonly roleFilter = signal<RoleFilter>('all');
  readonly checkins = signal<readonly CheckinListItem[]>([]);
  readonly message = signal<string | null>(null);
  readonly messageIsError = signal(false);

  readonly filterOptions: readonly RoleFilter[] = ['all', 'dps', 'tank', 'support'];

  readonly hasPermission = computed(() => {
    const role = this.auth.userRole();
    return role === 'streamer' || role === 'admin';
  });

  readonly availableTournaments = computed(() =>
    this.tournaments().filter((tournament) => tournament.teamMode === 'random'),
  );
  readonly canSendVisibleCheckinsToRoulette = computed(
    () => this.hasPermission() && !this.loadingCheckins() && this.checkins().length > 0,
  );

  readonly checkinsCountLabel = computed(() => `${this.checkins().length} check-ins encontrados`);

  constructor() {
    void this.loadTournaments();
  }

  async loadTournaments(): Promise<void> {
    this.loadingTournaments.set(true);
    this.setMessage(null, false);

    try {
      const response = await firstValueFrom(this.http.get<unknown>(this.torneiosApiUrl));
      const tournaments = this.readTournaments(response).map((item) => this.toTournament(item));
      this.tournaments.set(tournaments);

      if (!this.availableTournaments().some((item) => item.id === this.selectedTournamentId())) {
        this.selectedTournamentId.set('');
        this.checkins.set([]);
      }
    } catch (error: unknown) {
      this.tournaments.set([]);
      this.selectedTournamentId.set('');
      this.checkins.set([]);
      this.setMessage(this.resolveError(error, 'Não foi possível carregar os torneios.'), true);
    } finally {
      this.loadingTournaments.set(false);
    }
  }

  onTournamentChange(value: string): void {
    this.selectedTournamentId.set(value);
    this.checkins.set([]);
    this.setMessage(null, false);

    if (!value) return;
    void this.loadCheckins();
  }

  onRoleFilterChange(value: string): void {
    if (value === 'all' || value === 'tank' || value === 'dps' || value === 'support') {
      this.roleFilter.set(value);
    }

    this.checkins.set([]);
    this.setMessage(null, false);

    if (!this.selectedTournamentId()) return;
    void this.loadCheckins();
  }

  async loadCheckins(): Promise<void> {
    this.checkins.set([]);
    this.setMessage(null, false);

    if (!this.auth.isAuthenticated()) {
      this.setMessage('Sua sessão expirou. Faça login novamente.', true);
      return;
    }

    if (!this.hasPermission()) {
      this.setMessage('Acesso permitido apenas para streamer e admin.', true);
      return;
    }

    const tournamentId = this.selectedTournamentId();
    if (!tournamentId) {
      this.setMessage('Selecione um torneio para ver os check-ins.', true);
      return;
    }

    this.loadingCheckins.set(true);

    try {
      const filter = this.roleFilter();
      const query = filter === 'all' ? '' : `?role=${filter}`;
      const response = await firstValueFrom(
        this.http.get<unknown>(`${this.torneiosApiUrl}/${tournamentId}/checkins${query}`),
      );

      const checkins = this.readCheckins(response).map((item) => this.toCheckin(item));
      this.checkins.set(checkins);
    } catch (error: unknown) {
      this.setMessage(this.resolveError(error, 'Não foi possível carregar os check-ins.'), true);
    } finally {
      this.loadingCheckins.set(false);
    }
  }

  async sendVisibleCheckinsToRoulette(): Promise<void> {
    if (!this.canSendVisibleCheckinsToRoulette()) return;

    const storage = this.getSessionStorage();
    if (!storage) {
      this.setMessage('Não foi possível usar a roleta neste ambiente.', true);
      return;
    }

    const items = this.checkins().map((checkin, index) => this.toRouletteItem(checkin, index));

    try {
      storage.setItem(OW_ROULETTE_SESSION_STORAGE_KEY, JSON.stringify(items));
      await this.router.navigateByUrl(OW_ROULETTE_ROUTE);
    } catch {
      this.setMessage('Não foi possível enviar os usuários para a roleta.', true);
    }
  }

  roleLabel(role: CheckinListItem['role']): string {
    if (role === 'tank') return 'Tank';
    if (role === 'dps') return 'DPS';
    if (role === 'support') return 'Support';
    return 'Não informado';
  }

  roleBadgeClasses(role: CheckinListItem['role']): string {
    const base = 'inline-flex items-center rounded px-3 py-1 text-xs font-bold uppercase tracking-wider';

    if (role === 'dps') return `${base} bg-[color:var(--ow-blue)] text-white`;
    if (role === 'tank') return `${base} bg-[color:var(--ow-orange)] text-white`;
    if (role === 'support') return `${base} bg-green-600 text-white`;
    return `${base} bg-[color:var(--ow-gray-400)] text-white`;
  }

  formatCheckedInAt(value: string | null): string {
    if (!value) return 'Data não informada';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(parsed);
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

  private readCheckins(value: unknown): readonly RawRecord[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is RawRecord => this.isRecord(item));
    }

    if (!this.isRecord(value)) return [];

    for (const key of ['data', 'items', 'results', 'checkins']) {
      const maybeArray = value[key];
      if (!Array.isArray(maybeArray)) continue;

      return maybeArray.filter((item): item is RawRecord => this.isRecord(item));
    }

    return [];
  }

  private toTournament(value: RawRecord): TournamentListItem {
    return {
      id: this.readString(value, 'id') ?? '',
      name: this.readString(value, 'name') ?? 'Torneio sem nome',
      status: this.readString(value, 'status') ?? 'desconhecido',
      teamMode: (this.readString(value, 'teamMode') ?? 'desconhecido').toLowerCase(),
    };
  }

  private toCheckin(value: RawRecord): CheckinListItem {
    const roleRaw = (this.readString(value, 'role') ?? '').toLowerCase();
    const role: CheckinListItem['role'] =
      roleRaw === 'tank' || roleRaw === 'dps' || roleRaw === 'support' ? roleRaw : 'unknown';

    return {
      id: this.readString(value, 'id') ?? '',
      uid: this.readString(value, 'uid') ?? '-',
      displayName: this.readString(value, 'displayName') ?? 'Sem nome',
      battletag: this.readString(value, 'battletag') ?? 'Sem BattleTag',
      role,
      checkedInAt: this.readString(value, 'checkedInAt'),
      teamId: this.readString(value, 'teamId'),
    };
  }

  private toRouletteItem(checkin: CheckinListItem, index: number): OwRouletteListItem {
    const id = checkin.uid !== '-' ? checkin.uid : checkin.id || `checkin-${index + 1}`;
    const hasBattleTag = checkin.battletag !== 'Sem BattleTag';
    const name = hasBattleTag ? `${checkin.displayName} (${checkin.battletag})` : checkin.displayName;

    return {
      id,
      name,
      battletag: hasBattleTag ? checkin.battletag : null,
      displayName: checkin.displayName,
    };
  }

  private getSessionStorage(): Storage | null {
    if (!this.isBrowser) return null;
    if (typeof window === 'undefined') return null;
    if (!('sessionStorage' in window)) return null;

    return window.sessionStorage;
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

  private setMessage(value: string | null, isError: boolean): void {
    this.message.set(value);
    this.messageIsError.set(!!value && isError);
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
