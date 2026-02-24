import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/auth.service';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';

type RawRecord = Readonly<Record<string, unknown>>;
type TeamCategory = 'formed' | 'random' | 'unknown';
type ParticipationScope = 'participa' | 'participou';

type TeamDetail = Readonly<{
  id: string;
  name: string;
  category: TeamCategory;
  categoryLabel: string;
  captainUid: string | null;
  captainName: string;
  membersCount: number;
  createdAtLabel: string;
}>;

type TeamMemberItem = Readonly<{
  trackKey: string;
  uid: string;
  displayName: string;
  battletag: string;
  joinedAtLabel: string;
  isCaptain: boolean;
}>;

type TeamTournamentItem = Readonly<{
  id: string;
  name: string;
  status: string;
  statusLabel: string;
  checkedInLabel: string;
  teamModeLabel: string;
  participationScope: ParticipationScope;
  participationLabel: string;
  startAtLabel: string;
  trophyLabels: readonly string[];
}>;

type TeamTrophyItem = Readonly<{
  trackKey: string;
  tournamentName: string;
  label: string;
  icon: string;
}>;

@Component({
  selector: 'app-times-detalhe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, CardComponent],
  templateUrl: './times-detalhe.component.html',
  styleUrl: './times-detalhe.component.css',
})
export class TimesDetalheComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  private readonly timesApiUrl = `${environment.apiURLTimes}`;
  private readonly teamId = (this.route.snapshot.paramMap.get('id') ?? '').trim();

  readonly team = signal<TeamDetail | null>(null);
  readonly members = signal<readonly TeamMemberItem[]>([]);
  readonly tournaments = signal<readonly TeamTournamentItem[]>([]);
  readonly trophies = signal<readonly TeamTrophyItem[]>([]);

  readonly loadingTeam = signal(false);
  readonly loadingMembers = signal(false);
  readonly loadingTournaments = signal(false);
  readonly loadingMessage = signal<string | null>(null);

  readonly addMemberBattletag = signal('');
  readonly addingMember = signal(false);
  readonly addMemberMessage = signal<string | null>(null);
  readonly addMemberError = signal(false);
  readonly leavingTeam = signal(false);
  readonly leaveTeamMessage = signal<string | null>(null);
  readonly leaveTeamError = signal(false);
  readonly promotingCaptainUid = signal<string | null>(null);
  readonly promoteCaptainMessage = signal<string | null>(null);
  readonly promoteCaptainError = signal(false);

  readonly hasTeamId = computed(() => !!this.teamId);
  readonly isLoading = computed(
    () => this.loadingTeam() || this.loadingMembers() || this.loadingTournaments(),
  );
  readonly currentUserUid = computed(() => this.readCurrentUserUid());
  readonly isCurrentUserMember = computed(() => {
    const uid = this.currentUserUid();
    if (!uid) return false;

    return this.members().some((member) => member.uid === uid);
  });
  readonly canLeaveTeam = computed(
    () => this.hasTeamId() && this.isCurrentUserMember() && !this.leavingTeam(),
  );
  readonly isCurrentUserCaptain = computed(() => {
    const uid = this.currentUserUid();
    const captainUid = this.team()?.captainUid ?? null;
    if (!uid || !captainUid) return false;

    return uid === captainUid;
  });

  readonly activeTournaments = computed(() =>
    this.tournaments().filter((tournament) => tournament.participationScope === 'participa'),
  );
  readonly pastTournaments = computed(() =>
    this.tournaments().filter((tournament) => tournament.participationScope === 'participou'),
  );
  readonly teamLogoFallbackLabel = computed(() => {
    const name = this.team()?.name?.trim() ?? '';
    if (!name) return 'OW';

    const letters = name
      .split(/\s+/)
      .filter((part) => !!part)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    return letters || name.slice(0, 2).toUpperCase();
  });

  constructor() {
    void this.loadPage();
  }

  updateBattletag(value: string): void {
    this.addMemberBattletag.set(value);
  }

  async onAddMember(event: Event): Promise<void> {
    event.preventDefault();
    this.addMemberMessage.set(null);
    this.addMemberError.set(false);

    if (!this.hasTeamId()) {
      this.addMemberMessage.set('Time invalido para adicionar membro.');
      this.addMemberError.set(true);
      return;
    }

    const battletag = this.addMemberBattletag().trim();
    if (!battletag) {
      this.addMemberMessage.set('Informe a battletag do membro.');
      this.addMemberError.set(true);
      return;
    }

    this.addingMember.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<unknown>(`${this.timesApiUrl}/${this.teamId}/members`, { battletag }),
      );

      const action = this.readString(this.readRecord(response), 'action') ?? '';
      if (action === 'invited') {
        this.addMemberMessage.set('Convite enviado com sucesso para a battletag informada.');
      } else {
        this.addMemberMessage.set('Membro adicionado ao time com sucesso.');
      }
      this.addMemberError.set(false);
      this.addMemberBattletag.set('');

      await Promise.all([this.loadTeam(), this.loadMembers(), this.loadTournaments()]);
    } catch (error: unknown) {
      this.addMemberMessage.set(this.resolveError(error, 'Nao foi possivel adicionar o membro.'));
      this.addMemberError.set(true);
    } finally {
      this.addingMember.set(false);
    }
  }

  async onLeaveTeam(): Promise<void> {
    this.leaveTeamMessage.set(null);
    this.leaveTeamError.set(false);

    if (!this.hasTeamId()) {
      this.leaveTeamMessage.set('Time invalido para sair.');
      this.leaveTeamError.set(true);
      return;
    }

    if (!this.isCurrentUserMember()) {
      this.leaveTeamMessage.set('Voce nao faz parte deste time.');
      this.leaveTeamError.set(true);
      return;
    }

    this.leavingTeam.set(true);

    try {
      await firstValueFrom(this.http.delete<unknown>(`${this.timesApiUrl}/${this.teamId}/members/me`));
      await this.router.navigateByUrl('/watchpoint/times');
    } catch (error: unknown) {
      this.leaveTeamMessage.set(this.resolveError(error, 'Nao foi possivel sair do time.'));
      this.leaveTeamError.set(true);
    } finally {
      this.leavingTeam.set(false);
    }
  }

  canPromoteMember(member: TeamMemberItem): boolean {
    if (!member.uid.trim()) return false;
    if (member.isCaptain) return false;
    if (!this.isCurrentUserCaptain()) return false;

    return this.promotingCaptainUid() === null;
  }

  isPromotingMember(member: TeamMemberItem): boolean {
    return this.promotingCaptainUid() === member.uid;
  }

  async onPromoteCaptain(member: TeamMemberItem): Promise<void> {
    this.promoteCaptainMessage.set(null);
    this.promoteCaptainError.set(false);

    if (!this.hasTeamId()) {
      this.promoteCaptainMessage.set('Time invalido para transferir capitania.');
      this.promoteCaptainError.set(true);
      return;
    }

    if (!this.isCurrentUserCaptain()) {
      this.promoteCaptainMessage.set('Apenas o capitao atual pode promover outro integrante.');
      this.promoteCaptainError.set(true);
      return;
    }

    const targetUid = member.uid.trim();
    if (!targetUid) {
      this.promoteCaptainMessage.set('Integrante invalido para promover.');
      this.promoteCaptainError.set(true);
      return;
    }

    if (member.isCaptain) {
      this.promoteCaptainMessage.set('Este integrante ja e o capitao atual.');
      this.promoteCaptainError.set(true);
      return;
    }

    this.promotingCaptainUid.set(targetUid);

    try {
      await firstValueFrom(
        this.http.post<unknown>(`${this.timesApiUrl}/${this.teamId}/captain`, {
          uid: targetUid,
        }),
      );

      this.promoteCaptainMessage.set(`Capitania transferida para ${member.displayName}.`);
      this.promoteCaptainError.set(false);

      await Promise.all([this.loadTeam(), this.loadMembers()]);
    } catch (error: unknown) {
      this.promoteCaptainMessage.set(
        this.resolveError(error, 'Nao foi possivel transferir a capitania.'),
      );
      this.promoteCaptainError.set(true);
    } finally {
      this.promotingCaptainUid.set(null);
    }
  }

  private async loadPage(): Promise<void> {
    this.loadingMessage.set(null);

    if (!this.hasTeamId()) {
      this.team.set(null);
      this.members.set([]);
      this.tournaments.set([]);
      this.trophies.set([]);
      this.loadingMessage.set('Time invalido.');
      return;
    }

    try {
      await Promise.all([this.loadTeam(), this.loadMembers(), this.loadTournaments()]);
    } catch (error: unknown) {
      this.loadingMessage.set(this.resolveError(error, 'Nao foi possivel carregar os dados do time.'));
    }
  }

  private async loadTeam(): Promise<void> {
    this.loadingTeam.set(true);

    try {
      const response = await firstValueFrom(this.http.get<unknown>(`${this.timesApiUrl}/${this.teamId}`));
      const teamRecord = this.readTeam(response);
      if (!teamRecord) throw new Error('Time nao encontrado.');

      this.team.set(this.toTeamDetail(teamRecord));
    } finally {
      this.loadingTeam.set(false);
    }
  }

  private async loadMembers(): Promise<void> {
    this.loadingMembers.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${this.timesApiUrl}/${this.teamId}/members`),
      );
      const members = this.readRecords(response, ['members', 'data', 'items', 'results'])
        .map((item, index) => this.toMemberItem(item, index))
        .sort((a, b) => {
          if (a.isCaptain && !b.isCaptain) return -1;
          if (!a.isCaptain && b.isCaptain) return 1;
          return a.displayName.localeCompare(b.displayName, 'pt-BR');
        });

      this.members.set(members);
    } finally {
      this.loadingMembers.set(false);
    }
  }

  private async loadTournaments(): Promise<void> {
    this.loadingTournaments.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${this.timesApiUrl}/${this.teamId}/tournaments`),
      );
      const overview =
        this.readRecord(response) ??
        this.readRecord(this.readRecord(response)?.['data']) ??
        this.readRecord(this.readRecord(response)?.['overview']);
      if (!overview) {
        this.tournaments.set([]);
        this.trophies.set([]);
        return;
      }

      const tournaments = this.readRecords(overview['tournaments'], [
        'tournaments',
        'data',
        'items',
        'results',
      ])
        .map((item) => this.toTournamentItem(item));
      const trophies = this.readRecords(overview['trophies'], ['trophies', 'data', 'items', 'results'])
        .map((item, index) => this.toTrophyItem(item, index));

      this.tournaments.set(tournaments);
      this.trophies.set(trophies);
    } finally {
      this.loadingTournaments.set(false);
    }
  }

  private readTeam(value: unknown): RawRecord | null {
    const direct = this.readRecord(value);
    if (direct && this.readString(direct, 'id')) return direct;

    if (!direct) return null;

    for (const key of ['team', 'data', 'item', 'result']) {
      const nested = this.readRecord(direct[key]);
      if (!nested) continue;
      if (this.readString(nested, 'id')) return nested;
    }

    return null;
  }

  private readRecords(value: unknown, wrapperKeys: readonly string[]): readonly RawRecord[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is RawRecord => this.isRecord(item));
    }

    const root = this.readRecord(value);
    if (!root) return [];

    for (const key of wrapperKeys) {
      const nested = root[key];
      if (!Array.isArray(nested)) continue;
      return nested.filter((item): item is RawRecord => this.isRecord(item));
    }

    return [];
  }

  private toTeamDetail(value: RawRecord): TeamDetail {
    const category = this.readCategory(value);
    const createdAt =
      this.readString(value, 'createdAt') ??
      this.readString(value, 'created_at');

    return {
      id:
        this.readString(value, 'id') ??
        this.readString(value, '_id') ??
        this.readString(value, 'teamId') ??
        '',
      name: this.readString(value, 'name') ?? 'Time sem nome',
      category,
      categoryLabel: this.toCategoryLabel(category),
      captainUid:
        this.readString(value, 'captainUid') ??
        this.readString(value, 'captain_uid'),
      captainName:
        this.readString(value, 'captainName') ??
        this.readString(value, 'captainDisplayName') ??
        'Sem capitao definido',
      membersCount:
        this.readInteger(value['membersCount'] ?? value['members_count']) ?? 0,
      createdAtLabel: this.toDateTimeLabel(createdAt),
    };
  }

  private toMemberItem(value: RawRecord, index: number): TeamMemberItem {
    const uid =
      this.readString(value, 'uid') ??
      this.readString(value, 'userId') ??
      this.readString(value, 'id') ??
      `member-${index + 1}`;
    const captainUid = this.team()?.captainUid;
    const isCaptainFlag = this.readBoolean(value['isCaptain']);
    const isCaptain = isCaptainFlag ?? (!!captainUid && captainUid === uid);

    return {
      trackKey: uid || `member-${index + 1}`,
      uid,
      displayName: this.readString(value, 'displayName') ?? this.readString(value, 'name') ?? 'Usuario sem nome',
      battletag: this.readString(value, 'battletag') ?? 'Sem battletag',
      joinedAtLabel: this.toDateTimeLabel(
        this.readString(value, 'joinedAt') ?? this.readString(value, 'createdAt'),
      ),
      isCaptain,
    };
  }

  private toTournamentItem(value: RawRecord): TeamTournamentItem {
    const status = (this.readString(value, 'status') ?? 'desconhecido').toLowerCase();
    const participationScope = this.readParticipationScope(value, status);

    return {
      id: this.readString(value, 'id') ?? '',
      name: this.readString(value, 'name') ?? 'Torneio sem nome',
      status,
      statusLabel: this.toStatusLabel(status),
      checkedInLabel: this.readBoolean(value['checkedIn']) ? 'Check-in realizado' : 'Sem check-in',
      teamModeLabel: this.toTeamModeLabel(this.readString(value, 'teamMode')),
      participationScope,
      participationLabel:
        this.readString(value, 'participationLabel') ??
        (participationScope === 'participou' ? 'Participou' : 'Participa'),
      startAtLabel: this.toDateTimeLabel(this.readString(value, 'startAt')),
      trophyLabels: this.readStringList(value['trophyLabels']),
    };
  }

  private toTrophyItem(value: RawRecord, index: number): TeamTrophyItem {
    const tournamentName = this.readString(value, 'tournamentName') ?? 'Torneio';
    const label = this.readString(value, 'label') ?? 'Trofeu';

    return {
      trackKey: `${this.readString(value, 'tournamentId') ?? 'tournament'}-${index + 1}-${label}`,
      tournamentName,
      label,
      icon: this.readString(value, 'icon') ?? '🏆',
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
    return 'Categoria nao informada';
  }

  private readParticipationScope(value: RawRecord, status: string): ParticipationScope {
    const raw = (this.readString(value, 'participationScope') ?? '').toLowerCase();
    if (raw === 'participa' || raw === 'participou') return raw;
    return status === 'finished' || status === 'canceled' ? 'participou' : 'participa';
  }

  private toTeamModeLabel(value: string | null): string {
    const normalized = (value ?? '').toLowerCase();
    if (normalized === 'random') return 'Times sorteados';
    if (normalized === 'closed') return 'Times fechados';
    return 'Modo desconhecido';
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

  private toDateTimeLabel(value: string | null): string {
    if (!value) return 'Nao informado';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(parsed);
  }

  private readStringList(value: unknown): readonly string[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => !!item);
  }

  private readCurrentUserUid(): string | null {
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

  private readString(value: RawRecord | null, field: string): string | null {
    if (!value) return null;

    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
  }

  private readBoolean(value: unknown): boolean | null {
    if (typeof value !== 'boolean') return null;
    return value;
  }

  private readInteger(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.floor(value);
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value.trim(), 10);
      if (Number.isInteger(parsed)) return parsed;
    }

    return null;
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
}
