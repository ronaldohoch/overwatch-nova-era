import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';

type RawRecord = Readonly<Record<string, unknown>>;
type TeamCategory = 'formed' | 'random' | 'unknown';
const TEAM_RESPONSE_KEYS = ['teams', 'data', 'items', 'results', 'payload'] as const;
type AdminTeamScopeFilter = 'all' | 'mine';
type TeamCategoryFilter = 'all' | 'formed' | 'random';

type TeamListItem = Readonly<{
  trackKey: string;
  id: string;
  name: string;
  category: TeamCategory;
  categoryLabel: string;
  membersCount: number;
  captainUid: string | null;
  roleInTeamLabel: string;
  createdAtTimestamp: number;
}>;

@Component({
  selector: 'app-times-listagem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, CardComponent, RouterLink],
  templateUrl: './times-listagem.component.html',
  styleUrl: './times-listagem.component.css',
})
export class TimesListagemComponent {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  private readonly timesApiUrl = `${environment.apiURLTimes}`;

  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly teams = signal<readonly TeamListItem[]>([]);
  readonly adminTeamScopeFilter = signal<AdminTeamScopeFilter>('all');
  readonly teamCategoryFilter = signal<TeamCategoryFilter>('all');

  readonly isPrivilegedViewer = computed(() => {
    const role = this.auth.userRole();
    return role === 'admin' || role === 'streamer';
  });
  readonly isAdminViewer = computed(() => this.auth.userRole() === 'admin');

  readonly subtitle = computed(() =>
    this.isAdminViewer() && this.adminTeamScopeFilter() === 'mine'
      ? 'Exibindo apenas os times que você participa.'
      : this.isPrivilegedViewer()
      ? 'Exibindo todos os times cadastrados.'
      : 'Exibindo apenas os times que você participa.',
  );
  readonly filteredTeams = computed(() => {
    const filter = this.teamCategoryFilter();
    if (filter === 'all') return this.teams();

    return this.teams().filter((team) => team.category === filter);
  });

  constructor() {
    void this.loadTeams();
  }

  applyAdminTeamScopeFilter(value: string): void {
    const nextValue: AdminTeamScopeFilter = value === 'mine' ? 'mine' : 'all';
    if (nextValue === this.adminTeamScopeFilter()) return;

    this.adminTeamScopeFilter.set(nextValue);
    void this.loadTeams();
  }

  applyTeamCategoryFilter(value: string): void {
    const nextValue: TeamCategoryFilter =
      value === 'formed' || value === 'random' ? value : 'all';

    this.teamCategoryFilter.set(nextValue);
  }

  async loadTeams(): Promise<void> {
    this.loading.set(true);
    this.message.set(null);

    if (!this.auth.isAuthenticated()) {
      this.teams.set([]);
      this.loading.set(false);
      this.message.set('Faça login para listar os times.');
      return;
    }

    try {
      const endpoint = this.resolveTeamsEndpoint();

      const response = await firstValueFrom(this.http.get<unknown>(endpoint));
      const currentUserId = this.readCurrentUserId();
      const currentUserDisplayName = this.readCurrentUserDisplayName();

      const teams = this.readTeams(response)
        .map((item) => this.toTeamListItem(item, currentUserId, currentUserDisplayName))
        .sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);

      this.teams.set(teams);
    } catch (error: unknown) {
      this.teams.set([]);
      this.message.set(this.resolveError(error, 'Não foi possível carregar os times.'));
    } finally {
      this.loading.set(false);
    }
  }

  private readCurrentUserId(): string | null {
    const user = this.auth.user();
    if (!user) return null;

    for (const key of ['id', 'uid', 'sub']) {
      const raw = user[key];
      if (typeof raw !== 'string') continue;

      const normalized = raw.trim();
      if (normalized) return normalized;
    }

    return null;
  }

  private readCurrentUserDisplayName(): string | null {
    const user = this.auth.user();
    if (!user) return null;

    for (const key of ['displayName', 'name']) {
      const raw = user[key];
      if (typeof raw !== 'string') continue;

      const normalized = raw.trim();
      if (normalized) return normalized;
    }

    return null;
  }

  private resolveTeamsEndpoint(): string {
    if (this.isAdminViewer() && this.adminTeamScopeFilter() === 'mine') {
      return `${this.timesApiUrl}/me`;
    }

    if (this.isPrivilegedViewer()) {
      return this.timesApiUrl;
    }

    return `${this.timesApiUrl}/me`;
  }

  private readTeams(value: unknown): readonly RawRecord[] {
    return this.extractRecordArray(value, 0);
  }

  private extractRecordArray(value: unknown, depth: number): readonly RawRecord[] {
    if (depth > 5) return [];

    if (Array.isArray(value)) {
      return value.filter((item): item is RawRecord => this.isRecord(item));
    }

    if (!this.isRecord(value)) return [];

    for (const key of TEAM_RESPONSE_KEYS) {
      const nested = value[key];
      if (nested == null) continue;

      const nestedResult = this.extractRecordArray(nested, depth + 1);
      if (nestedResult.length > 0) return nestedResult;
      if (Array.isArray(nested)) return nestedResult;
    }

    return [];
  }

  private toTeamListItem(
    value: RawRecord,
    currentUserId: string | null,
    currentUserDisplayName: string | null,
  ): TeamListItem {
    const id =
      this.readString(value, 'id') ??
      this.readString(value, '_id') ??
      this.readString(value, 'teamId') ??
      '';
    const name =
      this.readString(value, 'name') ??
      this.readString(value, 'teamName') ??
      this.readString(value, 'title') ??
      'Time sem nome';
    const category = this.readCategory(value);
    const membersCount = this.readInteger(
      value['membersCount'] ?? value['members_count'] ?? value['size'],
    );
    const captainUid =
      this.readString(value, 'captainUid') ??
      this.readString(value, 'captain_uid') ??
      this.readString(value, 'createdByUid');
    const captainName = this.readCaptainName(
      value,
      captainUid,
      currentUserId,
      currentUserDisplayName,
    );
    const createdAtTimestamp = this.toTimestamp(
      this.readString(value, 'createdAt') ??
      this.readString(value, 'created_at') ??
      this.readString(value, 'createdAtIso'),
    );

    return {
      trackKey: id || `${name}-${createdAtTimestamp}`,
      id,
      name,
      category,
      categoryLabel: this.toCategoryLabel(category),
      membersCount: membersCount > 0 ? membersCount : 0,
      captainUid,
      roleInTeamLabel: captainName,
      createdAtTimestamp,
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

  private toCategoryLabel(category: TeamCategory): string {
    if (category === 'formed') return 'Time com participantes selecionados';
    if (category === 'random') return 'Time com participantes sorteados';
    return 'Categoria não informada';
  }

  teamLogo(category: TeamCategory): string {
    if (category === 'random') return '🎲';
    if (category === 'formed') return '🔥';
    return '🛡️';
  }

  teamCardStatus(team: TeamListItem): string {
    if (team.category === 'random') return 'quarter';
    if (team.category === 'formed') return 'group';
    return 'default';
  }

  teamDetailLink(team: TeamListItem): string {
    const teamId = team.id.trim();
    if (!teamId) return '/watchpoint/times';
    return `/watchpoint/time/${encodeURIComponent(teamId)}/detalhe`;
  }

  captainStatusLabel(team: TeamListItem): string {
    return team.captainUid ? 'Capitão definido' : 'Sem capitão';
  }

  private readCaptainName(
    value: RawRecord,
    captainUid: string | null,
    currentUserId: string | null,
    currentUserDisplayName: string | null,
  ): string {
    const directCaptainName =
      this.readString(value, 'captainName') ??
      this.readString(value, 'captainDisplayName') ??
      this.readString(value, 'captain_display_name');
    if (directCaptainName) return directCaptainName;

    const captainObject =
      this.readRecord(value['captain']) ??
      this.readRecord(value['captainUser']) ??
      this.readRecord(value['leader']);
    if (captainObject) {
      const nestedName =
        this.readString(captainObject, 'displayName') ??
        this.readString(captainObject, 'name');
      if (nestedName) return nestedName;
    }

    if (captainUid && currentUserId && captainUid === currentUserId && currentUserDisplayName) {
      return currentUserDisplayName;
    }

    if (captainUid) return 'Capitão sem nome informado';
    return 'Sem capitão';
  }

  private readRecord(value: unknown): RawRecord | null {
    return this.isRecord(value) ? value : null;
  }

  private toTimestamp(value: string | null): number {
    if (!value) return 0;

    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
  }

  private readInteger(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.floor(value);
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value.trim(), 10);
      return Number.isInteger(parsed) ? parsed : 0;
    }

    return 0;
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
