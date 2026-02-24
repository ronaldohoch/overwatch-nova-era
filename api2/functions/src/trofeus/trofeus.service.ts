import { FieldValue } from 'firebase-admin/firestore';
import { UserRole } from '../_enums/role.enum';
import { firestore } from '../firebase';

const TROPHY_CATALOG_COLLECTION = 'trophyCatalog';
const USERS_COLLECTION = 'users';
const TEAMS_COLLECTION = 'teams';
const DEFAULT_TROPHY_ICON = '🏅';

type TrophyTarget = 'user' | 'team' | 'both';
type AwardTargetType = 'user' | 'team';
type AwardMode = 'manual' | 'automatic';

type TrophyActor = Readonly<{
  uid: string;
  role: string;
}>;

type TrophySummary = Readonly<{
  id: string;
  code: string;
  name: string;
  icon: string;
  target: TrophyTarget;
  assignedAt: string;
}>;

type TrophyAutomation = Readonly<{
  enabled: boolean;
  event: string | null;
}>;

type StoredTrophyCatalog = Readonly<{
  code: string;
  codeLower: string;
  name: string;
  description: string | null;
  icon: string;
  target: TrophyTarget;
  active: boolean;
  automation: TrophyAutomation;
  createdAt: string;
  updatedAt: string | FirebaseFirestore.FieldValue;
  createdByUid: string;
  createdByRole: UserRole | 'unknown';
}>;

type StoredTrophyAssignment = Readonly<{
  trophyId: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  target: TrophyTarget;
  awardedAt: string;
  awardedByUid: string;
  awardedByRole: UserRole | 'streamer' | 'system' | 'unknown';
  mode: AwardMode;
  reason: string | null;
  sourceEvent: string | null;
}>;

type CreateTrophyDto = Readonly<{
  code?: unknown;
  name?: unknown;
  description?: unknown;
  icon?: unknown;
  target?: unknown;
  active?: unknown;
  automation?: unknown;
}>;

type AwardTrophyDto = Readonly<{
  trophyId?: unknown;
  trophyCode?: unknown;
  targetType?: unknown;
  uid?: unknown;
  userId?: unknown;
  battletag?: unknown;
  teamId?: unknown;
  teamName?: unknown;
  reason?: unknown;
}>;

type AutomaticAwardContext = Readonly<{
  userUid?: string;
  teamId?: string;
  reason?: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

type CatalogEntity = Readonly<{
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  target: TrophyTarget;
  active: boolean;
  automation: TrophyAutomation;
  createdAt: string;
}>;

type AwardResult = Readonly<{
  targetType: AwardTargetType;
  targetId: string;
  trophyId: string;
  trophyCode: string;
  trophyName: string;
  assigned: boolean;
  alreadyAssigned: boolean;
}>;

type ErrorWithStatus = Error & { statusCode?: number };

function fail(message: string, statusCode: number): never {
  const error = new Error(message) as ErrorWithStatus;
  error.statusCode = statusCode;
  throw error;
}

function normalizeStatusCode(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  if (value < 100 || value > 599) return null;
  return value;
}

export function resolveTrofeusErrorStatus(error: unknown, fallbackStatus: number): number {
  if (!error || typeof error !== 'object') return fallbackStatus;
  const statusCode = normalizeStatusCode((error as { statusCode?: unknown }).statusCode);
  return statusCode ?? fallbackStatus;
}

export class TrofeusService {
  private readonly catalogCollection = firestore.collection(TROPHY_CATALOG_COLLECTION);
  private readonly usersCollection = firestore.collection(USERS_COLLECTION);
  private readonly teamsCollection = firestore.collection(TEAMS_COLLECTION);

  private parseUid(value: unknown, fieldName = 'uid'): string {
    if (typeof value !== 'string') fail(`Campo ${fieldName} invalido.`, 400);

    const normalized = value.trim();
    if (!normalized) fail(`Campo ${fieldName} invalido.`, 400);
    return normalized;
  }

  private parseOptionalString(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const normalized = value.trim();
    return normalized || null;
  }

  private parseName(value: unknown): string {
    if (typeof value !== 'string') fail('Nome do trofeu e obrigatorio.', 400);

    const normalized = value.trim();
    if (!normalized) fail('Nome do trofeu e obrigatorio.', 400);
    if (normalized.length > 80) fail('Nome do trofeu deve ter no maximo 80 caracteres.', 400);
    return normalized;
  }

  private parseDescription(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value !== 'string') fail('Descricao do trofeu invalida.', 400);

    const normalized = value.trim();
    if (!normalized) return null;
    if (normalized.length > 240) fail('Descricao do trofeu deve ter no maximo 240 caracteres.', 400);
    return normalized;
  }

  private parseIcon(value: unknown): string {
    if (value == null) return DEFAULT_TROPHY_ICON;
    if (typeof value !== 'string') fail('Icone do trofeu invalido.', 400);

    const normalized = value.trim();
    if (!normalized) return DEFAULT_TROPHY_ICON;
    if (normalized.length > 10) fail('Icone do trofeu deve ter no maximo 10 caracteres.', 400);
    return normalized;
  }

  private normalizeCodeValue(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private buildCode(name: string, codeCandidate: unknown): string {
    const providedCode = this.parseOptionalString(codeCandidate);
    const base = providedCode ?? name;
    const normalized = this.normalizeCodeValue(base);
    if (!normalized) fail('Codigo do trofeu invalido.', 400);
    if (normalized.length > 64) fail('Codigo do trofeu deve ter no maximo 64 caracteres.', 400);
    return normalized;
  }

  private parseTarget(value: unknown): TrophyTarget {
    if (value == null) return 'both';
    if (typeof value !== 'string') fail('Target do trofeu invalido.', 400);

    const normalized = value.trim().toLowerCase();
    if (normalized === 'user' || normalized === 'team' || normalized === 'both') {
      return normalized;
    }

    fail('Target do trofeu invalido. Use user, team ou both.', 400);
  }

  private parseAwardTargetType(value: unknown): AwardTargetType {
    if (typeof value !== 'string') fail('targetType invalido. Use user ou team.', 400);
    const normalized = value.trim().toLowerCase();

    if (normalized === 'user' || normalized === 'team') return normalized;
    fail('targetType invalido. Use user ou team.', 400);
  }

  private parseRole(value: unknown): UserRole | 'streamer' | 'system' | 'unknown' {
    if (typeof value !== 'string') return 'unknown';

    const normalized = value.trim().toLowerCase();
    if (normalized === UserRole.ADMIN) return UserRole.ADMIN;
    if (normalized === UserRole.STREAMER) return UserRole.STREAMER;
    if (normalized === UserRole.COMPETIDOR) return UserRole.COMPETIDOR;
    if (normalized === 'system') return 'system';
    return 'unknown';
  }

  private parseActive(value: unknown): boolean {
    if (value == null) return true;
    if (typeof value !== 'boolean') fail('Campo active invalido.', 400);
    return value;
  }

  private parseAutomation(value: unknown): TrophyAutomation {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {
        enabled: false,
        event: null,
      };
    }

    const raw = value as Record<string, unknown>;
    const enabled = typeof raw['enabled'] === 'boolean' ? raw['enabled'] : false;
    const event = this.parseOptionalString(raw['event']);

    if (enabled && !event) {
      fail('Evento de automacao obrigatorio quando automation.enabled=true.', 400);
    }

    return {
      enabled,
      event,
    };
  }

  private parseCatalogEntity(id: string, value: Record<string, unknown>): CatalogEntity {
    const target = this.parseTarget(value['target']);
    const active = typeof value['active'] === 'boolean' ? value['active'] : true;

    return {
      id,
      code: this.parseOptionalString(value['code']) ?? id,
      name: this.parseOptionalString(value['name']) ?? 'Trofeu',
      description: this.parseOptionalString(value['description']),
      icon: this.parseOptionalString(value['icon']) ?? DEFAULT_TROPHY_ICON,
      target,
      active,
      automation: this.parseAutomation(value['automation']),
      createdAt: this.parseOptionalString(value['createdAt']) ?? '',
    };
  }

  private parseBattletag(value: unknown): string {
    if (typeof value !== 'string') fail('Campo battletag invalido.', 400);

    const normalized = value.trim();
    if (!normalized) fail('Campo battletag invalido.', 400);
    return normalized;
  }

  private async findUserByBattletag(battletag: string): Promise<{ uid: string; battletag: string }> {
    const normalized = this.parseBattletag(battletag);
    const lower = normalized.toLowerCase();

    const byLower = await this.usersCollection
      .where('battletagLower', '==', lower)
      .limit(1)
      .get();

    if (!byLower.empty) {
      const user = byLower.docs[0];
      const data = (user.data() ?? {}) as Record<string, unknown>;
      return {
        uid: user.id,
        battletag: this.parseOptionalString(data['battletag']) ?? normalized,
      };
    }

    const byRaw = await this.usersCollection
      .where('battletag', '==', normalized)
      .limit(1)
      .get();

    if (!byRaw.empty) {
      const user = byRaw.docs[0];
      const data = (user.data() ?? {}) as Record<string, unknown>;
      return {
        uid: user.id,
        battletag: this.parseOptionalString(data['battletag']) ?? normalized,
      };
    }

    fail('Nao encontramos usuario com essa battletag.', 404);
  }

  private async findTeamByName(name: string): Promise<string> {
    const normalized = this.parseName(name);
    const snapshot = await this.teamsCollection
      .where('name', '==', normalized)
      .limit(1)
      .get();

    if (snapshot.empty) fail('Time nao encontrado com esse nome.', 404);
    return snapshot.docs[0].id;
  }

  private isAdmin(role: UserRole | 'streamer' | 'system' | 'unknown'): boolean {
    return role === UserRole.ADMIN;
  }

  private canAward(role: UserRole | 'streamer' | 'system' | 'unknown'): boolean {
    return role === UserRole.ADMIN || role === UserRole.STREAMER;
  }

  private async resolveCatalogByReference(payload: AwardTrophyDto): Promise<CatalogEntity> {
    const trophyId = this.parseOptionalString(payload.trophyId);
    if (trophyId) {
      const snapshot = await this.catalogCollection.doc(trophyId).get();
      if (!snapshot.exists) fail('Trofeu nao encontrado.', 404);
      return this.parseCatalogEntity(snapshot.id, (snapshot.data() ?? {}) as Record<string, unknown>);
    }

    const trophyCode = this.parseOptionalString(payload.trophyCode);
    if (trophyCode) {
      const normalizedCode = this.normalizeCodeValue(trophyCode);
      const snapshot = await this.catalogCollection
        .where('codeLower', '==', normalizedCode)
        .limit(1)
        .get();
      if (snapshot.empty) fail('Trofeu nao encontrado.', 404);

      const doc = snapshot.docs[0];
      return this.parseCatalogEntity(doc.id, (doc.data() ?? {}) as Record<string, unknown>);
    }

    fail('Informe trophyId ou trophyCode.', 400);
  }

  private async resolveUserTarget(payload: AwardTrophyDto): Promise<string> {
    const uidRaw = payload.uid ?? payload.userId;
    if (uidRaw != null) return this.parseUid(uidRaw, 'uid');

    if (payload.battletag != null) {
      const found = await this.findUserByBattletag(this.parseBattletag(payload.battletag));
      return found.uid;
    }

    fail('Informe uid, userId ou battletag para o target user.', 400);
  }

  private async resolveTeamTarget(payload: AwardTrophyDto): Promise<string> {
    if (payload.teamId != null) return this.parseUid(payload.teamId, 'teamId');

    if (payload.teamName != null) {
      return this.findTeamByName(this.parseName(payload.teamName));
    }

    fail('Informe teamId ou teamName para o target team.', 400);
  }

  private buildSummaryFromCatalog(catalog: CatalogEntity, assignedAt: string): TrophySummary {
    return {
      id: catalog.id,
      code: catalog.code,
      name: catalog.name,
      icon: catalog.icon || DEFAULT_TROPHY_ICON,
      target: catalog.target,
      assignedAt,
    };
  }

  private buildAssignmentFromCatalog(
    catalog: CatalogEntity,
    actorUid: string,
    actorRole: UserRole | 'streamer' | 'system' | 'unknown',
    mode: AwardMode,
    reason: string | null,
    sourceEvent: string | null,
    awardedAt: string,
  ): StoredTrophyAssignment {
    return {
      trophyId: catalog.id,
      code: catalog.code,
      name: catalog.name,
      description: catalog.description,
      icon: catalog.icon || DEFAULT_TROPHY_ICON,
      target: catalog.target,
      awardedAt,
      awardedByUid: actorUid,
      awardedByRole: actorRole,
      mode,
      reason,
      sourceEvent,
    };
  }

  private assertCatalogAllowsTarget(catalog: CatalogEntity, targetType: AwardTargetType): void {
    if (catalog.target === 'both') return;
    if (catalog.target === targetType) return;

    fail(
      `Trofeu ${catalog.code} nao pode ser aplicado ao target ${targetType}.`,
      400,
    );
  }

  private async awardTrophyToUser(
    catalog: CatalogEntity,
    userUid: string,
    actorUid: string,
    actorRole: UserRole | 'streamer' | 'system' | 'unknown',
    mode: AwardMode,
    reason: string | null,
    sourceEvent: string | null,
  ): Promise<AwardResult> {
    const normalizedUid = this.parseUid(userUid, 'uid');
    const userRef = this.usersCollection.doc(normalizedUid);
    const assignmentRef = userRef.collection('trophies').doc(catalog.id);
    const assignedAt = new Date().toISOString();
    const summary = this.buildSummaryFromCatalog(catalog, assignedAt);
    const assignment = this.buildAssignmentFromCatalog(
      catalog,
      actorUid,
      actorRole,
      mode,
      reason,
      sourceEvent,
      assignedAt,
    );

    let assigned = false;
    await firestore.runTransaction(async (tx) => {
      const [userSnapshot, assignmentSnapshot] = await Promise.all([
        tx.get(userRef),
        tx.get(assignmentRef),
      ]);

      if (!userSnapshot.exists) {
        fail('Usuario nao encontrado.', 404);
      }

      if (assignmentSnapshot.exists) {
        assigned = false;
        return;
      }

      tx.set(assignmentRef, assignment);
      tx.set(
        userRef,
        {
          trophies: FieldValue.arrayUnion(summary),
        },
        { merge: true },
      );
      assigned = true;
    });

    return {
      targetType: 'user',
      targetId: normalizedUid,
      trophyId: catalog.id,
      trophyCode: catalog.code,
      trophyName: catalog.name,
      assigned,
      alreadyAssigned: !assigned,
    };
  }

  private async awardTrophyToTeam(
    catalog: CatalogEntity,
    teamId: string,
    actorUid: string,
    actorRole: UserRole | 'streamer' | 'system' | 'unknown',
    mode: AwardMode,
    reason: string | null,
    sourceEvent: string | null,
  ): Promise<AwardResult> {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    const teamRef = this.teamsCollection.doc(normalizedTeamId);
    const assignmentRef = teamRef.collection('trophies').doc(catalog.id);
    const assignedAt = new Date().toISOString();
    const summary = this.buildSummaryFromCatalog(catalog, assignedAt);
    const assignment = this.buildAssignmentFromCatalog(
      catalog,
      actorUid,
      actorRole,
      mode,
      reason,
      sourceEvent,
      assignedAt,
    );

    let assigned = false;
    await firestore.runTransaction(async (tx) => {
      const [teamSnapshot, assignmentSnapshot] = await Promise.all([
        tx.get(teamRef),
        tx.get(assignmentRef),
      ]);

      if (!teamSnapshot.exists) {
        fail('Time nao encontrado.', 404);
      }

      if (assignmentSnapshot.exists) {
        assigned = false;
        return;
      }

      tx.set(assignmentRef, assignment);
      tx.set(
        teamRef,
        {
          trophies: FieldValue.arrayUnion(summary),
        },
        { merge: true },
      );
      assigned = true;
    });

    return {
      targetType: 'team',
      targetId: normalizedTeamId,
      trophyId: catalog.id,
      trophyCode: catalog.code,
      trophyName: catalog.name,
      assigned,
      alreadyAssigned: !assigned,
    };
  }

  async createCatalogTrophy(actor: TrophyActor, payload: CreateTrophyDto): Promise<CatalogEntity> {
    const actorUid = this.parseUid(actor.uid, 'uid');
    const actorRole = this.parseRole(actor.role);
    if (!this.isAdmin(actorRole)) {
      fail('Apenas admin pode cadastrar trofeus.', 403);
    }

    const name = this.parseName(payload.name);
    const code = this.buildCode(name, payload.code);
    const description = this.parseDescription(payload.description);
    const icon = this.parseIcon(payload.icon);
    const target = this.parseTarget(payload.target);
    const active = this.parseActive(payload.active);
    const automation = this.parseAutomation(payload.automation);

    const existing = await this.catalogCollection
      .where('codeLower', '==', code.toLowerCase())
      .limit(1)
      .get();

    if (!existing.empty) {
      fail('Ja existe trofeu com esse codigo.', 409);
    }

    const now = new Date().toISOString();
    const docToStore: StoredTrophyCatalog = {
      code,
      codeLower: code.toLowerCase(),
      name,
      description,
      icon,
      target,
      active,
      automation,
      createdAt: now,
      updatedAt: now,
      createdByUid: actorUid,
      createdByRole: actorRole === UserRole.ADMIN ? UserRole.ADMIN : 'unknown',
    };

    const createdRef = await this.catalogCollection.add(docToStore);
    return {
      id: createdRef.id,
      code,
      name,
      description,
      icon,
      target,
      active,
      automation,
      createdAt: now,
    };
  }

  async listCatalog(): Promise<CatalogEntity[]> {
    const snapshot = await this.catalogCollection
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) =>
      this.parseCatalogEntity(doc.id, (doc.data() ?? {}) as Record<string, unknown>),
    );
  }

  async awardManual(actor: TrophyActor, payload: AwardTrophyDto): Promise<AwardResult> {
    const actorUid = this.parseUid(actor.uid, 'uid');
    const actorRole = this.parseRole(actor.role);
    if (!this.canAward(actorRole)) {
      fail('Apenas admin ou streamer pode conceder trofeu.', 403);
    }

    const catalog = await this.resolveCatalogByReference(payload);
    if (!catalog.active) {
      fail('Trofeu inativo nao pode ser concedido.', 400);
    }

    const targetType = this.parseAwardTargetType(payload.targetType);
    this.assertCatalogAllowsTarget(catalog, targetType);

    const reason = this.parseOptionalString(payload.reason);
    if (targetType === 'user') {
      const targetUid = await this.resolveUserTarget(payload);
      return this.awardTrophyToUser(
        catalog,
        targetUid,
        actorUid,
        actorRole,
        'manual',
        reason,
        null,
      );
    }

    const targetTeamId = await this.resolveTeamTarget(payload);
    return this.awardTrophyToTeam(
      catalog,
      targetTeamId,
      actorUid,
      actorRole,
      'manual',
      reason,
      null,
    );
  }

  async awardAutomaticByEvent(
    eventCode: string,
    context: AutomaticAwardContext,
  ): Promise<Readonly<{ eventCode: string; awards: readonly AwardResult[] }>> {
    const normalizedEvent = this.parseOptionalString(eventCode);
    if (!normalizedEvent) {
      return {
        eventCode: '',
        awards: [],
      };
    }

    const snapshot = await this.catalogCollection
      .where('automation.event', '==', normalizedEvent)
      .get();

    if (snapshot.empty) {
      return {
        eventCode: normalizedEvent,
        awards: [],
      };
    }

    const reason = this.parseOptionalString(context.reason);
    const actorUid = 'system';
    const actorRole: 'system' = 'system';
    const awards: AwardResult[] = [];

    for (const doc of snapshot.docs) {
      const catalog = this.parseCatalogEntity(doc.id, (doc.data() ?? {}) as Record<string, unknown>);
      if (!catalog.active || !catalog.automation.enabled) continue;

      if ((catalog.target === 'user' || catalog.target === 'both') && context.userUid) {
        const userAward = await this.awardTrophyToUser(
          catalog,
          context.userUid,
          actorUid,
          actorRole,
          'automatic',
          reason,
          normalizedEvent,
        );
        awards.push(userAward);
      }

      if ((catalog.target === 'team' || catalog.target === 'both') && context.teamId) {
        const teamAward = await this.awardTrophyToTeam(
          catalog,
          context.teamId,
          actorUid,
          actorRole,
          'automatic',
          reason,
          normalizedEvent,
        );
        awards.push(teamAward);
      }
    }

    return {
      eventCode: normalizedEvent,
      awards,
    };
  }
}

export const trofeusSvc = new TrofeusService();

export async function grantAutomaticTrophiesForEvent(
  eventCode: string,
  context: AutomaticAwardContext,
) {
  return trofeusSvc.awardAutomaticByEvent(eventCode, context);
}
