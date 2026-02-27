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
const TEAM_LOGO_MAX_BYTES = 2 * 1024 * 1024;
const TEAM_LOGO_ALLOWED_MIME_TYPES = new Set(['image/png', 'image/webp']);

type TeamDetail = Readonly<{
  id: string;
  name: string;
  description: string | null;
  groupLink: string | null;
  category: TeamCategory;
  categoryLabel: string;
  captainUid: string | null;
  captainName: string;
  membersCount: number;
  createdAtLabel: string;
  logoPath: string | null;
  logoUrl: string | null;
  logoMimeType: string | null;
  logoUpdatedAtLabel: string | null;
}>;

type TeamMemberItem = Readonly<{
  trackKey: string;
  uid: string;
  displayName: string;
  battletag: string;
  email: string | null;
  whatsapp: string | null;
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
  readonly editTeamName = signal('');
  readonly editTeamDescription = signal('');
  readonly editTeamGroupLink = signal('');
  readonly updatingTeamData = signal(false);
  readonly updateTeamDataMessage = signal<string | null>(null);
  readonly updateTeamDataError = signal(false);
  readonly leavingTeam = signal(false);
  readonly leaveTeamMessage = signal<string | null>(null);
  readonly leaveTeamError = signal(false);
  readonly removingMemberUid = signal<string | null>(null);
  readonly removeMemberMessage = signal<string | null>(null);
  readonly removeMemberError = signal(false);
  readonly contactModalMember = signal<TeamMemberItem | null>(null);
  readonly promotingCaptainUid = signal<string | null>(null);
  readonly promoteCaptainMessage = signal<string | null>(null);
  readonly promoteCaptainError = signal(false);
  readonly selectedLogoFile = signal<File | null>(null);
  readonly uploadingLogo = signal(false);
  readonly uploadLogoMessage = signal<string | null>(null);
  readonly uploadLogoError = signal(false);
  readonly removingLogo = signal(false);
  readonly removeLogoMessage = signal<string | null>(null);
  readonly removeLogoError = signal(false);

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
  readonly isAdmin = computed(() => this.auth.userRole() === 'admin');
  readonly canEditTeamData = computed(() => this.hasTeamId() && this.isAdmin());
  readonly canUploadTeamLogo = computed(
    () =>
      this.canEditTeamData() &&
      !this.uploadingLogo() &&
      !this.removingLogo() &&
      !!this.selectedLogoFile(),
  );
  readonly canRemoveTeamLogo = computed(
    () =>
      this.canEditTeamData() &&
      !this.uploadingLogo() &&
      !this.removingLogo() &&
      !!this.team()?.logoPath,
  );
  readonly hasTeamDataChanges = computed(() => {
    const team = this.team();
    if (!team) return false;

    return (
      this.normalizeField(this.editTeamName()) !== this.normalizeField(team.name) ||
      this.normalizeField(this.editTeamDescription()) !== this.normalizeField(team.description) ||
      this.normalizeField(this.editTeamGroupLink()) !== this.normalizeField(team.groupLink)
    );
  });
  readonly canSubmitTeamData = computed(
    () => this.canEditTeamData() && !this.updatingTeamData() && this.hasTeamDataChanges(),
  );
  readonly canAdminRemoveMembers = computed(() => {
    if (!this.hasTeamId()) return false;
    if (!this.isAdmin()) return false;
    return this.team()?.category === 'random';
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
  readonly selectedLogoFileLabel = computed(() => this.selectedLogoFile()?.name ?? null);

  constructor() {
    void this.loadPage();
  }

  updateBattletag(value: string): void {
    this.addMemberBattletag.set(value);
  }

  updateTeamName(value: string): void {
    this.editTeamName.set(value);
  }

  updateTeamDescription(value: string): void {
    this.editTeamDescription.set(value);
  }

  updateTeamGroupLink(value: string): void {
    this.editTeamGroupLink.set(value);
  }

  onSelectLogoFile(event: Event): void {
    this.uploadLogoMessage.set(null);
    this.uploadLogoError.set(false);

    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0) ?? null;
    this.selectedLogoFile.set(file);
  }

  clearSelectedLogoFile(): void {
    this.selectedLogoFile.set(null);
  }

  async onUploadTeamLogo(event: Event): Promise<void> {
    event.preventDefault();
    this.uploadLogoMessage.set(null);
    this.uploadLogoError.set(false);
    this.removeLogoMessage.set(null);
    this.removeLogoError.set(false);

    if (!this.hasTeamId()) {
      this.uploadLogoMessage.set('Time inválido para atualizar logo.');
      this.uploadLogoError.set(true);
      return;
    }

    if (!this.canEditTeamData()) {
      this.uploadLogoMessage.set('Apenas admin pode atualizar a logo do time.');
      this.uploadLogoError.set(true);
      return;
    }

    const file = this.selectedLogoFile();
    if (!file) {
      this.uploadLogoMessage.set('Selecione um arquivo .png ou .webp.');
      this.uploadLogoError.set(true);
      return;
    }

    if (!TEAM_LOGO_ALLOWED_MIME_TYPES.has(file.type)) {
      this.uploadLogoMessage.set('Formato inválido. Envie apenas imagem PNG ou WEBP.');
      this.uploadLogoError.set(true);
      return;
    }

    if (file.size > TEAM_LOGO_MAX_BYTES) {
      this.uploadLogoMessage.set('Arquivo muito grande. Limite: 2 MB.');
      this.uploadLogoError.set(true);
      return;
    }

    this.uploadingLogo.set(true);

    try {
      const base64 = await this.readFileAsBase64(file);
      await firstValueFrom(
        this.http.post<unknown>(`${this.timesApiUrl}/${this.teamId}/logo`, {
          fileName: file.name,
          mimeType: file.type,
          dataBase64: base64,
        }),
      );

      this.selectedLogoFile.set(null);
      this.uploadLogoMessage.set('Logo atualizada com sucesso.');
      this.uploadLogoError.set(false);

      await this.loadTeam();
    } catch (error: unknown) {
      this.uploadLogoMessage.set(this.resolveError(error, 'Não foi possível atualizar a logo.'));
      this.uploadLogoError.set(true);
    } finally {
      this.uploadingLogo.set(false);
    }
  }

  async onRemoveTeamLogo(): Promise<void> {
    this.removeLogoMessage.set(null);
    this.removeLogoError.set(false);
    this.uploadLogoMessage.set(null);
    this.uploadLogoError.set(false);

    if (!this.hasTeamId()) {
      this.removeLogoMessage.set('Time inválido para remover logo.');
      this.removeLogoError.set(true);
      return;
    }

    if (!this.canEditTeamData()) {
      this.removeLogoMessage.set('Apenas admin pode remover a logo do time.');
      this.removeLogoError.set(true);
      return;
    }

    this.removingLogo.set(true);

    try {
      await firstValueFrom(this.http.delete<unknown>(`${this.timesApiUrl}/${this.teamId}/logo`));
      this.selectedLogoFile.set(null);
      this.removeLogoMessage.set('Logo removida com sucesso.');
      this.removeLogoError.set(false);

      await this.loadTeam();
    } catch (error: unknown) {
      this.removeLogoMessage.set(this.resolveError(error, 'Não foi possível remover a logo.'));
      this.removeLogoError.set(true);
    } finally {
      this.removingLogo.set(false);
    }
  }

  async onUpdateTeamData(event: Event): Promise<void> {
    event.preventDefault();
    this.updateTeamDataMessage.set(null);
    this.updateTeamDataError.set(false);

    if (!this.hasTeamId()) {
      this.updateTeamDataMessage.set('Time inválido para atualizar.');
      this.updateTeamDataError.set(true);
      return;
    }

    if (!this.isAdmin()) {
      this.updateTeamDataMessage.set('Apenas admin pode alterar dados do time.');
      this.updateTeamDataError.set(true);
      return;
    }

    const team = this.team();
    if (!team) {
      this.updateTeamDataMessage.set('Carregue o time antes de atualizar.');
      this.updateTeamDataError.set(true);
      return;
    }

    const name = this.normalizeField(this.editTeamName());
    const description = this.normalizeField(this.editTeamDescription());
    const groupLink = this.normalizeField(this.editTeamGroupLink());

    if (!name) {
      this.updateTeamDataMessage.set('Nome do time é obrigatório.');
      this.updateTeamDataError.set(true);
      return;
    }

    const payload: Record<string, string> = {};

    if (name !== this.normalizeField(team.name)) {
      payload['name'] = name;
    }

    if (description !== this.normalizeField(team.description)) {
      payload['description'] = description;
    }

    if (groupLink !== this.normalizeField(team.groupLink)) {
      payload['groupLink'] = groupLink;
    }

    if (Object.keys(payload).length === 0) {
      this.updateTeamDataMessage.set('Nenhuma alteração para salvar.');
      this.updateTeamDataError.set(false);
      return;
    }

    this.updatingTeamData.set(true);

    try {
      await firstValueFrom(this.http.patch<unknown>(`${this.timesApiUrl}/${this.teamId}`, payload));
      await this.loadTeam();
      this.updateTeamDataMessage.set('Dados do time atualizados com sucesso.');
      this.updateTeamDataError.set(false);
    } catch (error: unknown) {
      this.updateTeamDataMessage.set(
        this.resolveError(error, 'Não foi possível atualizar os dados do time.'),
      );
      this.updateTeamDataError.set(true);
    } finally {
      this.updatingTeamData.set(false);
    }
  }

  async onAddMember(event: Event): Promise<void> {
    event.preventDefault();
    this.addMemberMessage.set(null);
    this.addMemberError.set(false);

    if (!this.hasTeamId()) {
      this.addMemberMessage.set('Time inválido para adicionar membro.');
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
      this.addMemberMessage.set(this.resolveError(error, 'Não foi possível adicionar o membro.'));
      this.addMemberError.set(true);
    } finally {
      this.addingMember.set(false);
    }
  }

  async onLeaveTeam(): Promise<void> {
    this.leaveTeamMessage.set(null);
    this.leaveTeamError.set(false);

    if (!this.hasTeamId()) {
      this.leaveTeamMessage.set('Time inválido para sair.');
      this.leaveTeamError.set(true);
      return;
    }

    if (!this.isCurrentUserMember()) {
      this.leaveTeamMessage.set('Você não faz parte deste time.');
      this.leaveTeamError.set(true);
      return;
    }

    this.leavingTeam.set(true);

    try {
      await firstValueFrom(this.http.delete<unknown>(`${this.timesApiUrl}/${this.teamId}/members/me`));
      await this.router.navigateByUrl('/watchpoint/times');
    } catch (error: unknown) {
      this.leaveTeamMessage.set(this.resolveError(error, 'Não foi possível sair do time.'));
      this.leaveTeamError.set(true);
    } finally {
      this.leavingTeam.set(false);
    }
  }

  canPromoteMember(member: TeamMemberItem): boolean {
    if (!member.uid.trim()) return false;
    if (member.isCaptain) return false;
    if (!this.isCurrentUserCaptain() && !this.isAdmin()) return false;

    return this.promotingCaptainUid() === null;
  }

  isPromotingMember(member: TeamMemberItem): boolean {
    return this.promotingCaptainUid() === member.uid;
  }

  canRemoveMember(member: TeamMemberItem): boolean {
    if (!this.canAdminRemoveMembers()) return false;
    if (!member.uid.trim()) return false;
    return this.removingMemberUid() === null;
  }

  isRemovingMember(member: TeamMemberItem): boolean {
    return this.removingMemberUid() === member.uid;
  }

  canOpenContactModal(): boolean {
    return this.isAdmin();
  }

  openContactModal(member: TeamMemberItem): void {
    if (!this.canOpenContactModal()) return;
    this.contactModalMember.set(member);
  }

  closeContactModal(): void {
    this.contactModalMember.set(null);
  }

  async onPromoteCaptain(member: TeamMemberItem): Promise<void> {
    this.promoteCaptainMessage.set(null);
    this.promoteCaptainError.set(false);

    if (!this.hasTeamId()) {
      this.promoteCaptainMessage.set('Time inválido para transferir capitania.');
      this.promoteCaptainError.set(true);
      return;
    }

    if (!this.isCurrentUserCaptain() && !this.isAdmin()) {
      this.promoteCaptainMessage.set('Apenas o capitão atual ou admin pode promover outro integrante.');
      this.promoteCaptainError.set(true);
      return;
    }

    const targetUid = member.uid.trim();
    if (!targetUid) {
      this.promoteCaptainMessage.set('Integrante inválido para promover.');
      this.promoteCaptainError.set(true);
      return;
    }

    if (member.isCaptain) {
      this.promoteCaptainMessage.set('Este integrante já é o capitão atual.');
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
        this.resolveError(error, 'Não foi possível transferir a capitania.'),
      );
      this.promoteCaptainError.set(true);
    } finally {
      this.promotingCaptainUid.set(null);
    }
  }

  async onRemoveMember(member: TeamMemberItem): Promise<void> {
    this.removeMemberMessage.set(null);
    this.removeMemberError.set(false);

    if (!this.hasTeamId()) {
      this.removeMemberMessage.set('Time inválido para remover membro.');
      this.removeMemberError.set(true);
      return;
    }

    if (!this.canAdminRemoveMembers()) {
      this.removeMemberMessage.set('Somente admin pode remover membros de times random.');
      this.removeMemberError.set(true);
      return;
    }

    const targetUid = member.uid.trim();
    if (!targetUid) {
      this.removeMemberMessage.set('Membro inválido para remover.');
      this.removeMemberError.set(true);
      return;
    }

    this.removingMemberUid.set(targetUid);

    try {
      await firstValueFrom(
        this.http.delete<unknown>(`${this.timesApiUrl}/${this.teamId}/members/${encodeURIComponent(targetUid)}`),
      );

      this.removeMemberMessage.set(`Integrante ${member.displayName} removido com sucesso.`);
      this.removeMemberError.set(false);

      await Promise.all([this.loadTeam(), this.loadMembers()]);
    } catch (error: unknown) {
      this.removeMemberMessage.set(this.resolveError(error, 'Não foi possível remover o integrante.'));
      this.removeMemberError.set(true);
    } finally {
      this.removingMemberUid.set(null);
    }
  }

  private async loadPage(): Promise<void> {
    this.loadingMessage.set(null);

    if (!this.hasTeamId()) {
      this.team.set(null);
      this.syncTeamDataForm(null);
      this.members.set([]);
      this.tournaments.set([]);
      this.trophies.set([]);
      this.loadingMessage.set('Time inválido.');
      return;
    }

    try {
      await Promise.all([this.loadTeam(), this.loadMembers(), this.loadTournaments()]);
    } catch (error: unknown) {
      this.loadingMessage.set(this.resolveError(error, 'Não foi possível carregar os dados do time.'));
    }
  }

  private async loadTeam(): Promise<void> {
    this.loadingTeam.set(true);

    try {
      const response = await firstValueFrom(this.http.get<unknown>(`${this.timesApiUrl}/${this.teamId}`));
      const teamRecord = this.readTeam(response);
      if (!teamRecord) throw new Error('Time não encontrado.');

      const team = this.toTeamDetail(teamRecord);
      this.team.set(team);
      this.syncTeamDataForm(team);
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
    const logoUpdatedAt =
      this.readString(value, 'logoUpdatedAt') ??
      this.readString(value, 'logo_updated_at');

    return {
      id:
        this.readString(value, 'id') ??
        this.readString(value, '_id') ??
        this.readString(value, 'teamId') ??
        '',
      name: this.readString(value, 'name') ?? 'Time sem nome',
      description:
        this.readString(value, 'description') ??
        this.readString(value, 'teamDescription'),
      groupLink:
        this.readString(value, 'groupLink') ??
        this.readString(value, 'group_link') ??
        this.readString(value, 'whatsappGroupLink'),
      category,
      categoryLabel: this.toCategoryLabel(category),
      captainUid:
        this.readString(value, 'captainUid') ??
        this.readString(value, 'captain_uid'),
      captainName:
        this.readString(value, 'captainName') ??
        this.readString(value, 'captainDisplayName') ??
        'Sem capitão definido',
      membersCount:
        this.readInteger(value['membersCount'] ?? value['members_count']) ?? 0,
      createdAtLabel: this.toDateTimeLabel(createdAt),
      logoPath:
        this.readString(value, 'logoPath') ??
        this.readString(value, 'logo_path'),
      logoUrl:
        this.readString(value, 'logoUrl') ??
        this.readString(value, 'logo_url'),
      logoMimeType:
        this.readString(value, 'logoMimeType') ??
        this.readString(value, 'logo_mime_type'),
      logoUpdatedAtLabel: logoUpdatedAt ? this.toDateTimeLabel(logoUpdatedAt) : null,
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
      displayName: this.readString(value, 'displayName') ?? this.readString(value, 'name') ?? 'Usuário sem nome',
      battletag: this.readString(value, 'battletag') ?? 'Sem battletag',
      email: this.readString(value, 'email'),
      whatsapp: this.readString(value, 'whatsapp'),
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
    const label = this.readString(value, 'label') ?? 'Troféu';

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
    return 'Categoria não informada';
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
    if (!value) return 'Não informado';

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

  private async readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Conteúdo do arquivo inválido.'));
          return;
        }

        const base64 = result.includes(',') ? result.split(',').pop() ?? '' : result;
        if (!base64) {
          reject(new Error('Conteúdo do arquivo inválido.'));
          return;
        }

        resolve(base64);
      };

      reader.readAsDataURL(file);
    });
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

  private syncTeamDataForm(team: TeamDetail | null): void {
    this.editTeamName.set(team?.name ?? '');
    this.editTeamDescription.set(team?.description ?? '');
    this.editTeamGroupLink.set(team?.groupLink ?? '');
  }

  private normalizeField(value: string | null): string {
    return (value ?? '').trim();
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


