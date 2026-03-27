import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UserRole } from '../_enums/role.enum';
import { firestore } from '../firebase';
import {
  ActorRole,
  AddMemberDto,
  CreateTeamDto,
  UpdateTeamDto,
  ErrorWithStatus,
  ParticipationScope,
  StoredInvite,
  StoredMember,
  StoredTeam,
  TeamActor,
  TeamCategory,
  TeamTournamentSummary,
  TeamTournamentsOverview,
  TeamTrophySummary,
  TransferCaptainDto,
} from './interfaces';


const USERS_COLLECTION = 'users';
const NO_CAPTAIN_LABEL = 'Sem capitao definido';
const UNNAMED_CAPTAIN_LABEL = 'Capitao sem nome informado';
const DEFAULT_TEAM_LOGO_BUCKET = 'copa-nova-era-overwatch.firebasestorage.app';
const TEAM_LOGO_FOLDER = 'times/logos';

const TEAM_LOGO_MAX_BYTES = 2 * 1024 * 1024;
const TEAM_LOGO_MIME_TYPES = new Set(['image/png', 'image/webp']);


function fail(message: string, statusCode: number): never {
  const error = new Error(message) as ErrorWithStatus;
  error.statusCode = statusCode;
  throw error;
}

function readStatusCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;

  const value = (error as { statusCode?: unknown }).statusCode;
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;

  if (value < 100 || value > 599) return null;
  return value;
}

export function resolveTimesErrorStatus(error: unknown, fallbackStatus: number): number {
  return readStatusCode(error) ?? fallbackStatus;
}

export class TimesService {
  private teamsCollection = firestore.collection('teams');
  private readonly logosBucketName = this.resolveLogosBucketName();
  private readonly logosBucket = admin.storage().bucket(this.logosBucketName);

  private membersCol(teamId: string) {
    return this.teamsCollection.doc(teamId).collection('members');
  }

  private invitesCol(teamId: string) {
    return this.teamsCollection.doc(teamId).collection('invites');
  }

  private usersCollection() {
    return firestore.collection(USERS_COLLECTION);
  }

  private parseUid(value: unknown, fieldName = 'uid'): string {
    if (typeof value !== 'string') {
      fail(`Campo ${fieldName} invalido.`, 400);
    }

    const normalized = value.trim();
    if (!normalized) fail(`Campo ${fieldName} invalido.`, 400);
    return normalized;
  }

  private parseName(value: unknown): string {
    if (typeof value !== 'string') fail('Nome do time e obrigatorio.', 400);

    const normalized = value.trim();
    if (!normalized) fail('Nome do time e obrigatorio.', 400);
    if (normalized.length > 80) fail('Nome do time deve ter no maximo 80 caracteres.', 400);
    return normalized;
  }

  private parseTag(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value !== 'string') fail('Tag do time invalida.', 400);

    const normalized = value.trim();
    if (!normalized) return null;
    if (normalized.length > 16) fail('Tag do time deve ter no maximo 16 caracteres.', 400);
    return normalized;
  }

  private parseDescription(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value !== 'string') fail('Descricao do time invalida.', 400);

    const normalized = value.trim();
    if (!normalized) return null;
    if (normalized.length > 240) fail('Descricao do time deve ter no maximo 240 caracteres.', 400);
    return normalized;
  }

  private parseGroupLink(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value !== 'string') fail('groupLink invalido.', 400);

    const normalized = value.trim();
    if (!normalized) return null;
    if (normalized.length > 500) fail('groupLink deve ter no maximo 500 caracteres.', 400);

    try {
      const parsed = new URL(normalized);
      const protocol = parsed.protocol.toLowerCase();
      if (protocol !== 'http:' && protocol !== 'https:') {
        fail('groupLink deve usar http ou https.', 400);
      }
    } catch {
      fail('groupLink invalido.', 400);
    }

    return normalized;
  }

  private parseTeamCategory(value: unknown): TeamCategory {
    if (value == null) return 'formed';
    if (typeof value !== 'string') fail('Categoria do time invalida. Use formed ou random.', 400);

    const category = value.trim().toLowerCase();
    if (category === 'formed' || category === 'random') return category;
    fail('Categoria do time invalida. Use formed ou random.', 400);
  }

  private parseRole(value: unknown): ActorRole {
    if (typeof value !== 'string') return 'unknown';

    const normalized = value.trim().toLowerCase();
    if (normalized === UserRole.ADMIN) return UserRole.ADMIN;
    if (normalized === UserRole.STREAMER) return UserRole.STREAMER;
    if (normalized === UserRole.COMPETIDOR) return UserRole.COMPETIDOR;
    return 'unknown';
  }

  private resolveLogosBucketName(): string {
    const fromEnv =
      this.normalizeOptionalString(process.env['TEAMS_LOGOS_BUCKET']) ??
      this.normalizeOptionalString(process.env['FIREBASE_STORAGE_BUCKET']) ??
      this.normalizeOptionalString(process.env['GCLOUD_STORAGE_BUCKET']);

    return fromEnv ?? DEFAULT_TEAM_LOGO_BUCKET;
  }

  private toAlternateLogoBucketName(bucketName: string): string | null {
    if (bucketName.endsWith('.firebasestorage.app')) {
      const projectId = bucketName.slice(0, -'.firebasestorage.app'.length);
      return projectId ? `${projectId}.appspot.com` : null;
    }

    if (bucketName.endsWith('.appspot.com')) {
      const projectId = bucketName.slice(0, -'.appspot.com'.length);
      return projectId ? `${projectId}.firebasestorage.app` : null;
    }

    return null;
  }

  private resolveLogoBucketCandidates(bucketHint: string | null): readonly string[] {
    const candidates = [
      bucketHint,
      this.logosBucketName,
      bucketHint ? this.toAlternateLogoBucketName(bucketHint) : null,
      this.toAlternateLogoBucketName(this.logosBucketName),
    ]
      .map((value) => this.normalizeOptionalString(value))
      .filter((value): value is string => !!value);

    return Array.from(new Set(candidates));
  }

  private parseLogoReference(value: string): { bucketName: string | null; objectPath: string } {
    const normalized = value.trim();
    if (!normalized) {
      return {
        bucketName: null,
        objectPath: '',
      };
    }

    if (normalized.startsWith('gs://')) {
      const withoutScheme = normalized.slice('gs://'.length);
      const slashIndex = withoutScheme.indexOf('/');
      if (slashIndex > 0) {
        const bucketName = this.normalizeOptionalString(withoutScheme.slice(0, slashIndex));
        const objectPath = withoutScheme.slice(slashIndex + 1).replace(/^\/+/, '').trim();
        return {
          bucketName,
          objectPath,
        };
      }
    }

    try {
      const parsed = new URL(normalized);
      const firebaseStorageMatch = parsed.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (firebaseStorageMatch) {
        const bucketName = this.normalizeOptionalString(decodeURIComponent(firebaseStorageMatch[1]));
        const objectPath = decodeURIComponent(firebaseStorageMatch[2]).replace(/^\/+/, '').trim();
        return {
          bucketName,
          objectPath,
        };
      }

      if (parsed.hostname === 'storage.googleapis.com') {
        const parts = parsed.pathname.replace(/^\/+/, '').split('/');
        if (parts.length >= 2) {
          const [bucketPart, ...objectParts] = parts;
          const bucketName = this.normalizeOptionalString(bucketPart);
          const objectPath = objectParts.join('/').trim();
          return {
            bucketName,
            objectPath,
          };
        }
      }
    } catch {
      // Ignore URL parsing errors and treat value as object path.
    }

    return {
      bucketName: null,
      objectPath: normalized.replace(/^\/+/, ''),
    };
  }

  private assertAdminRole(actorRole: ActorRole) {
    if (actorRole !== UserRole.ADMIN) {
      fail('Apenas admin pode alterar logo do time.', 403);
    }
  }

  private ensureRecord(value: unknown, fieldName: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      fail(`Campo ${fieldName} invalido.`, 400);
    }

    return value as Record<string, unknown>;
  }

  private parseLogoMimeType(value: unknown): 'image/png' | 'image/webp' {
    if (typeof value !== 'string') {
      fail('mimeType da logo e obrigatorio (image/png ou image/webp).', 400);
    }

    const normalized = value.trim().toLowerCase();
    if (!TEAM_LOGO_MIME_TYPES.has(normalized)) {
      fail('Formato de logo invalido. Use image/png ou image/webp.', 400);
    }

    return normalized as 'image/png' | 'image/webp';
  }

  private parseLogoBase64(value: unknown): Buffer {
    if (typeof value !== 'string') {
      fail('Conteudo da logo e obrigatorio.', 400);
    }

    const normalized = value.trim();
    if (!normalized) {
      fail('Conteudo da logo e obrigatorio.', 400);
    }

    const rawBase64 = normalized.includes(',') ? normalized.split(',').pop() ?? '' : normalized;
    const safeBase64 = rawBase64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (!safeBase64) {
      fail('Conteudo da logo invalido.', 400);
    }

    const buffer = Buffer.from(safeBase64, 'base64');
    if (!buffer.length) {
      fail('Conteudo da logo invalido.', 400);
    }

    if (buffer.byteLength > TEAM_LOGO_MAX_BYTES) {
      fail(`Logo muito grande. Limite maximo: ${TEAM_LOGO_MAX_BYTES} bytes.`, 400);
    }

    return buffer;
  }

  private parseLogoFileName(value: unknown, fallbackExtension: 'png' | 'webp'): string {
    if (typeof value !== 'string') {
      return `logo.${fallbackExtension}`;
    }

    const normalized = value.trim();
    if (!normalized) return `logo.${fallbackExtension}`;
    if (normalized.length > 120) fail('Nome do arquivo da logo muito grande.', 400);
    return normalized;
  }

  private logoExtensionFromMimeType(mimeType: 'image/png' | 'image/webp'): 'png' | 'webp' {
    return mimeType === 'image/webp' ? 'webp' : 'png';
  }

  private buildTeamLogoPrefix(teamId: string): string {
    return `${TEAM_LOGO_FOLDER}/${teamId}-`;
  }

  private buildTeamLogoPath(teamId: string, extension: 'png' | 'webp'): string {
    return `${this.buildTeamLogoPrefix(teamId)}${Date.now()}.${extension}`;
  }

  private emulatorMediaUrl(bucketName: string, path: string): string | null {
    const host = this.normalizeOptionalString(process.env['FIREBASE_STORAGE_EMULATOR_HOST']);
    if (!host) return null;

    const baseHost = host.startsWith('http://') || host.startsWith('https://') ? host : `http://${host}`;
    return `${baseHost}/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media`;
  }

  private async resolveLogoUrl(
    rawPath: string,
    bucketNameHint: string | null,
  ): Promise<{ url: string | null; urlExpiresAt: string | null }> {
    const { bucketName: bucketFromPath, objectPath } = this.parseLogoReference(rawPath);
    if (!objectPath) {
      return { url: null, urlExpiresAt: null };
    }

    const bucketCandidates = this.resolveLogoBucketCandidates(bucketNameHint ?? bucketFromPath);
    const bucketName = bucketCandidates[0] ?? this.logosBucketName;

    const emulatorUrl = this.emulatorMediaUrl(bucketName, objectPath);
    if (emulatorUrl) {
      return { url: emulatorUrl, urlExpiresAt: null };
    }

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media`;
    return { url, urlExpiresAt: null };
  }

  private async withLogoUrl(team: Record<string, unknown>): Promise<Record<string, unknown>> {
    const logoPath = this.normalizeOptionalString(team['logoPath']);
    const logoBucketName =
      this.normalizeOptionalString(team['logoBucketName']) ??
      this.normalizeOptionalString(team['logoBucket']) ??
      this.normalizeOptionalString(team['logo_bucket_name']) ??
      this.normalizeOptionalString(team['logo_bucket']);
    const logoMimeType = this.normalizeOptionalString(team['logoMimeType']);
    const logoUpdatedAt = this.normalizeOptionalString(team['logoUpdatedAt']);

    if (!logoPath) {
      return {
        ...team,
        logoPath: null,
        logoBucketName: logoBucketName ?? null,
        logoMimeType: logoMimeType ?? null,
        logoUpdatedAt: logoUpdatedAt ?? null,
        logoUrl: null,
        logoUrlExpiresAt: null,
      };
    }

    try {
      const logoUrlData = await this.resolveLogoUrl(logoPath, logoBucketName);
      return {
        ...team,
        logoPath,
        logoBucketName: logoBucketName ?? null,
        logoMimeType: logoMimeType ?? null,
        logoUpdatedAt: logoUpdatedAt ?? null,
        logoUrl: logoUrlData.url,
        logoUrlExpiresAt: logoUrlData.urlExpiresAt,
      };
    } catch (error: unknown) {
      console.error('[times] Falha ao enriquecer logo do time:', {
        logoPath,
        logoBucketName,
        error,
      });

      return {
        ...team,
        logoPath,
        logoBucketName: logoBucketName ?? null,
        logoMimeType: logoMimeType ?? null,
        logoUpdatedAt: logoUpdatedAt ?? null,
        logoUrl: null,
        logoUrlExpiresAt: null,
      };
    }
  }

  private async deleteLogoPath(path: string | null, bucketNameHint: string | null = null) {
    const normalizedPath = this.normalizeOptionalString(path);
    if (!normalizedPath) return;

    const { bucketName: bucketFromPath, objectPath } = this.parseLogoReference(normalizedPath);
    if (!objectPath) return;

    const bucketCandidates = this.resolveLogoBucketCandidates(bucketNameHint ?? bucketFromPath);
    await Promise.all(
      bucketCandidates.map(async (bucketName) => {
        try {
          await admin.storage().bucket(bucketName).file(objectPath).delete({ ignoreNotFound: true });
        } catch (error: unknown) {
          console.error('[times] Falha ao remover logo antiga:', {
            bucketName,
            path: objectPath,
            error,
          });
        }
      }),
    );
  }

  private toNonNegativeInt(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
    if (value <= 0) return 0;
    return Math.floor(value);
  }

  private async assertUserExists(uid: string) {
    const userSnapshot = await this.usersCollection().doc(uid).get();
    if (!userSnapshot.exists) {
      fail('Usuario nao encontrado.', 404);
    }
  }

  private parseBattletag(value: unknown): string {
    if (typeof value !== 'string') {
      fail('Campo battletag invalido.', 400);
    }

    const normalized = value.trim();
    if (!normalized) fail('Campo battletag invalido.', 400);
    return normalized;
  }

  private normalizeOptionalUid(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const normalized = value.trim();
    return normalized || null;
  }

  private normalizeOptionalString(value: unknown): string | null {
    if (typeof value !== 'string') return null;

    const normalized = value.trim();
    return normalized || null;
  }

  private normalizeOptionalBoolean(value: unknown): boolean | null {
    if (typeof value !== 'boolean') return null;
    return value;
  }

  private normalizeOptionalInteger(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.floor(value);
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value.trim(), 10);
      if (Number.isInteger(parsed)) return parsed;
    }

    return null;
  }

  private async findUserByBattletag(battletag: string): Promise<{ uid: string; battletag: string }> {
    const normalizedBattletag = this.parseBattletag(battletag);
    const battletagLower = normalizedBattletag.toLowerCase();

    const lowerSnapshot = await this.usersCollection()
      .where('battletagLower', '==', battletagLower)
      .limit(1)
      .get();

    if (!lowerSnapshot.empty) {
      const user = lowerSnapshot.docs[0];
      const data = (user.data() ?? {}) as Record<string, unknown>;
      const storedBattletag = this.normalizeOptionalString(data['battletag']) ?? normalizedBattletag;
      return { uid: user.id, battletag: storedBattletag };
    }

    const rawSnapshot = await this.usersCollection()
      .where('battletag', '==', normalizedBattletag)
      .limit(1)
      .get();

    if (!rawSnapshot.empty) {
      const user = rawSnapshot.docs[0];
      const data = (user.data() ?? {}) as Record<string, unknown>;
      const storedBattletag = this.normalizeOptionalString(data['battletag']) ?? normalizedBattletag;
      return { uid: user.id, battletag: storedBattletag };
    }

    fail('Nao encontramos usuario com essa battletag.', 404);
  }

  private readUserDisplayName(value: unknown): string | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

    const raw = value as Record<string, unknown>;
    for (const key of ['displayName', 'name']) {
      const candidate = raw[key];
      if (typeof candidate !== 'string') continue;

      const normalized = candidate.trim();
      if (normalized) return normalized;
    }

    return null;
  }

  private readPublicTrophies(value: unknown): readonly Record<string, unknown>[] {
    if (!Array.isArray(value)) return [];

    const result: Record<string, unknown>[] = [];

    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const record = item as Record<string, unknown>;

      const id = this.normalizeOptionalUid(record['id']) ?? '';
      const code = this.normalizeOptionalString(record['code']) ?? '';
      const name = this.normalizeOptionalString(record['name']) ?? '';
      if (!id || !code || !name) continue;

      const target = this.normalizeOptionalString(record['target']);
      result.push({
        id,
        code,
        name,
        icon: this.normalizeOptionalString(record['icon']) ?? '🏅',
        target: target === 'user' || target === 'team' || target === 'both' ? target : 'both',
        assignedAt: this.normalizeOptionalString(record['assignedAt']) ?? '',
      });
    }

    return result;
  }

  private async readCaptainNamesByUid(
    uids: readonly string[],
  ): Promise<ReadonlyMap<string, string>> {
    const uniqueUids = Array.from(
      new Set(uids.map((uid) => this.normalizeOptionalUid(uid)).filter((uid): uid is string => !!uid)),
    );
    if (!uniqueUids.length) return new Map();

    const userRefs = uniqueUids.map((uid) => this.usersCollection().doc(uid));
    const userSnapshots = await firestore.getAll(...userRefs);

    const captainNames = new Map<string, string>();
    for (const userSnapshot of userSnapshots) {
      if (!userSnapshot.exists) continue;

      const name = this.readUserDisplayName(userSnapshot.data());
      if (!name) continue;

      captainNames.set(userSnapshot.id, name);
    }

    return captainNames;
  }

  private withCaptainName(
    team: Record<string, unknown>,
    captainNamesByUid: ReadonlyMap<string, string>,
  ): Record<string, unknown> {
    const trophies = this.readPublicTrophies(team['trophies']);
    const captainUid = this.normalizeOptionalUid(team['captainUid']);
    if (!captainUid) {
      return {
        ...team,
        trophies,
        captainUid: null,
        captainName: NO_CAPTAIN_LABEL,
        captainDisplayName: NO_CAPTAIN_LABEL,
      };
    }

    const captainName = captainNamesByUid.get(captainUid) ?? UNNAMED_CAPTAIN_LABEL;
    return {
      ...team,
      trophies,
      captainUid,
      captainName,
      captainDisplayName: captainName,
    };
  }

  private async enrichTeamsWithCaptainName(
    teams: readonly Record<string, unknown>[],
  ): Promise<ReadonlyArray<Record<string, unknown>>> {
    const captainUids = teams
      .map((team) => this.normalizeOptionalUid(team['captainUid']))
      .filter((uid): uid is string => !!uid);

    const captainNamesByUid = await this.readCaptainNamesByUid(captainUids);
    return teams.map((team) => this.withCaptainName(team, captainNamesByUid));
  }

  private async enrichTeamsForResponse(
    teams: readonly Record<string, unknown>[],
  ): Promise<ReadonlyArray<Record<string, unknown>>> {
    const teamsWithCaptainName = await this.enrichTeamsWithCaptainName(teams);
    return Promise.all(teamsWithCaptainName.map((team) => this.withLogoUrl(team)));
  }

  private async enrichTeamForResponse(
    team: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const [enriched] = await this.enrichTeamsForResponse([team]);
    return enriched;
  }

  private hasOwnField(source: unknown, field: string): boolean {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return false;
    return Object.prototype.hasOwnProperty.call(source, field);
  }

  async createTeam(actor: TeamActor, body: CreateTeamDto) {
    const actorUid = this.parseUid(actor.uid, 'uid');
    const actorRole = this.parseRole(actor.role);
    const name = this.parseName(body?.name);
    const description = this.parseDescription(body?.description);
    const groupLink = this.parseGroupLink(body?.groupLink);
    const tag = this.parseTag(body?.tag);
    const category = this.parseTeamCategory(body?.category);

    if (category === 'random' && actorRole !== UserRole.ADMIN && actorRole !== UserRole.STREAMER) {
      fail('Membro so pode criar time formed.', 403);
    }

    await this.assertUserExists(actorUid);

    const teamRef = this.teamsCollection.doc();
    const memberRef = this.membersCol(teamRef.id).doc(actorUid);
    const now = new Date().toISOString();

    const teamDoc: StoredTeam = {
      name,
      description,
      groupLink,
      tag,
      category,
      captainUid: actorUid,
      createdByUid: actorUid,
      membersCount: 1,
      createdAt: now,
      updatedAt: now,
      trophies: [],
    };

    const creatorMemberDoc: StoredMember = {
      uid: actorUid,
      joinedAt: now,
      addedByUid: actorUid,
      addedByRole: actorRole,
      source: 'creator',
    };

    await firestore.runTransaction(async (tx) => {
      tx.set(teamRef, teamDoc);
      tx.set(memberRef, creatorMemberDoc);
    });

    const created = await teamRef.get();
    return this.enrichTeamForResponse({
      id: created.id,
      ...(created.data() as Record<string, unknown>),
    });
  }

  async updateTeamData(teamId: string, actor: TeamActor, body: UpdateTeamDto) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    this.parseUid(actor.uid, 'uid');

    const actorRole = this.parseRole(actor.role);
    if (actorRole !== UserRole.ADMIN) {
      fail('Apenas admin pode alterar dados do time.', 403);
    }

    const hasName = this.hasOwnField(body, 'name');
    const hasDescription = this.hasOwnField(body, 'description');
    const hasGroupLink = this.hasOwnField(body, 'groupLink');

    if (!hasName && !hasDescription && !hasGroupLink) {
      fail('Informe ao menos um campo para atualizar: name, description ou groupLink.', 400);
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (hasName) {
      updates['name'] = this.parseName(body?.name);
    }

    if (hasDescription) {
      updates['description'] = this.parseDescription(body?.description);
    }

    if (hasGroupLink) {
      updates['groupLink'] = this.parseGroupLink(body?.groupLink);
    }

    const teamRef = this.teamsCollection.doc(normalizedTeamId);

    await firestore.runTransaction(async (tx) => {
      const teamSnapshot = await tx.get(teamRef);
      if (!teamSnapshot.exists) {
        fail('Time nao encontrado.', 404);
      }

      tx.update(teamRef, updates);
    });

    const updated = await teamRef.get();
    return this.enrichTeamForResponse({
      id: updated.id,
      ...(updated.data() as Record<string, unknown>),
    });
  }

  async updateTeamLogo(teamId: string, actor: TeamActor, body: unknown) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    this.parseUid(actor.uid, 'uid');

    const actorRole = this.parseRole(actor.role);
    this.assertAdminRole(actorRole);

    const payload = this.ensureRecord(body, 'body');
    const mimeType = this.parseLogoMimeType(payload['mimeType']);
    const extension = this.logoExtensionFromMimeType(mimeType);
    const fileName = this.parseLogoFileName(payload['fileName'], extension);
    const logoBuffer = this.parseLogoBase64(
      payload['dataBase64'] ?? payload['data'] ?? payload['base64'],
    );

    const teamRef = this.teamsCollection.doc(normalizedTeamId);
    const teamSnapshot = await teamRef.get();
    if (!teamSnapshot.exists) {
      fail('Time nao encontrado.', 404);
    }

    const teamData = (teamSnapshot.data() ?? {}) as Record<string, unknown>;
    const previousLogoPath = this.normalizeOptionalString(teamData['logoPath']);
    const previousLogoBucketName =
      this.normalizeOptionalString(teamData['logoBucketName']) ??
      this.normalizeOptionalString(teamData['logoBucket']) ??
      this.normalizeOptionalString(teamData['logo_bucket_name']) ??
      this.normalizeOptionalString(teamData['logo_bucket']);
    const nextLogoPath = this.buildTeamLogoPath(normalizedTeamId, extension);
    const nowIso = new Date().toISOString();

    await this.logosBucket.file(nextLogoPath).save(logoBuffer, {
      resumable: false,
      metadata: {
        contentType: mimeType,
        cacheControl: 'private, max-age=0, no-cache',
        metadata: {
          originalFileName: fileName,
          teamId: normalizedTeamId,
          uploadedAt: nowIso,
        },
      },
    });

    try {
      await firestore.runTransaction(async (tx) => {
        const latestTeamSnapshot = await tx.get(teamRef);
        if (!latestTeamSnapshot.exists) {
          fail('Time nao encontrado.', 404);
        }

        tx.update(teamRef, {
          logoPath: nextLogoPath,
          logoBucketName: this.logosBucketName,
          logoMimeType: mimeType,
          logoUpdatedAt: nowIso,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (error: unknown) {
      await this.deleteLogoPath(nextLogoPath);
      throw error;
    }

    if (previousLogoPath && previousLogoPath !== nextLogoPath) {
      await this.deleteLogoPath(previousLogoPath, previousLogoBucketName);
    }

    const updated = await teamRef.get();
    return this.enrichTeamForResponse({
      id: updated.id,
      ...(updated.data() as Record<string, unknown>),
    });
  }

  async removeTeamLogo(teamId: string, actor: TeamActor) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    this.parseUid(actor.uid, 'uid');

    const actorRole = this.parseRole(actor.role);
    this.assertAdminRole(actorRole);

    const teamRef = this.teamsCollection.doc(normalizedTeamId);
    let previousLogoPath: string | null = null;
    let previousLogoBucketName: string | null = null;

    await firestore.runTransaction(async (tx) => {
      const teamSnapshot = await tx.get(teamRef);
      if (!teamSnapshot.exists) {
        fail('Time nao encontrado.', 404);
      }

      const teamData = (teamSnapshot.data() ?? {}) as Record<string, unknown>;
      previousLogoPath = this.normalizeOptionalString(teamData['logoPath']);
      previousLogoBucketName =
        this.normalizeOptionalString(teamData['logoBucketName']) ??
        this.normalizeOptionalString(teamData['logoBucket']) ??
        this.normalizeOptionalString(teamData['logo_bucket_name']) ??
        this.normalizeOptionalString(teamData['logo_bucket']);

      tx.update(teamRef, {
        logoPath: null,
        logoBucketName: null,
        logoMimeType: null,
        logoUpdatedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await this.deleteLogoPath(previousLogoPath, previousLogoBucketName);

    const updated = await teamRef.get();
    return this.enrichTeamForResponse({
      id: updated.id,
      ...(updated.data() as Record<string, unknown>),
    });
  }

  async getTeam(teamId: string) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    const teamSnapshot = await this.teamsCollection.doc(normalizedTeamId).get();
    if (!teamSnapshot.exists) {
      fail('Time nao encontrado.', 404);
    }

    return this.enrichTeamForResponse({
      id: teamSnapshot.id,
      ...(teamSnapshot.data() as Record<string, unknown>),
    });
  }

  async listMembers(teamId: string, actor: TeamActor) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    this.parseUid(actor.uid, 'uid');
    const actorRole = this.parseRole(actor.role);
    const canViewContact = actorRole === UserRole.ADMIN;

    const teamSnapshot = await this.teamsCollection.doc(normalizedTeamId).get();
    if (!teamSnapshot.exists) {
      fail('Time nao encontrado.', 404);
    }

    const teamData = (teamSnapshot.data() ?? {}) as Record<string, unknown>;
    const captainUid = this.normalizeOptionalUid(teamData['captainUid']);

    const membersSnapshot = await this.membersCol(normalizedTeamId)
      .orderBy('joinedAt', 'asc')
      .get();

    const members = membersSnapshot.docs.map((doc) => {
      const raw = (doc.data() ?? {}) as Record<string, unknown>;
      const uid = this.normalizeOptionalUid(raw['uid']) ?? doc.id;

      return {
        id: doc.id,
        uid,
        ...raw,
      } as Record<string, unknown>;
    });

    const uniqueUids = Array.from(
      new Set(members.map((member) => this.normalizeOptionalUid(member['uid'])).filter((uid): uid is string => !!uid)),
    );

    const userRefs = uniqueUids.map((uid) => this.usersCollection().doc(uid));
    const userSnapshots = uniqueUids.length ? await firestore.getAll(...userRefs) : [];
    const userByUid = new Map<string, Record<string, unknown>>();
    for (const userSnapshot of userSnapshots) {
      if (!userSnapshot.exists) continue;
      userByUid.set(userSnapshot.id, (userSnapshot.data() ?? {}) as Record<string, unknown>);
    }

    return members.map((member) => {
      const uid = this.normalizeOptionalUid(member['uid']) ?? '';
      const user = uid ? userByUid.get(uid) ?? null : null;
      const displayName = this.readUserDisplayName(user) ?? 'Usuario sem nome';
      const battletag =
        this.normalizeOptionalString(user?.['battletag']) ??
        this.normalizeOptionalString(member['battletag']) ??
        'Sem battletag';
      const email =
        this.normalizeOptionalString(user?.['email']) ??
        this.normalizeOptionalString(member['email']);
      const whatsapp =
        this.normalizeOptionalString(user?.['whatsapp']) ??
        this.normalizeOptionalString(member['whatsapp']);

      return {
        ...member,
        uid,
        displayName,
        battletag,
        email: canViewContact ? email : null,
        whatsapp: canViewContact ? whatsapp : null,
        isCaptain: !!uid && !!captainUid && uid === captainUid,
      };
    });
  }

  async listAllTeams() {
    const snapshot = await this.teamsCollection
      .orderBy('createdAt', 'desc')
      .get();

    const teams = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...(doc.data() as Record<string, unknown>),
        }) as Record<string, unknown>,
    );

    return this.enrichTeamsForResponse(teams);
  }

  private isFailedPreconditionError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const code = (error as { code?: unknown }).code;
    if (code === 9 || code === '9' || code === 'failed-precondition') {
      return true;
    }

    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' && message.includes('FAILED_PRECONDITION');
  }

  private async listMyTeamsWithoutCollectionGroup(normalizedUid: string) {
    const teamsSnapshot = await this.teamsCollection
      .orderBy('createdAt', 'desc')
      .get();

    if (teamsSnapshot.empty) return [];

    const teamItems = teamsSnapshot.docs.map((doc) => ({
      id: doc.id,
      data: (doc.data() ?? {}) as Record<string, unknown>,
    }));

    const captainTeamIds = new Set<string>();
    const memberRefs: FirebaseFirestore.DocumentReference[] = [];
    const memberRefTeamIds: string[] = [];

    for (const item of teamItems) {
      if (item.data['captainUid'] === normalizedUid) {
        captainTeamIds.add(item.id);
        continue;
      }

      memberRefs.push(this.membersCol(item.id).doc(normalizedUid));
      memberRefTeamIds.push(item.id);
    }

    const memberTeamIds = new Set<string>();
    for (let index = 0; index < memberRefs.length; index += 300) {
      const chunkRefs = memberRefs.slice(index, index + 300);
      const chunkTeamIds = memberRefTeamIds.slice(index, index + 300);
      const chunkSnapshots = await firestore.getAll(...chunkRefs);

      chunkSnapshots.forEach((snapshot, chunkIndex) => {
        if (!snapshot.exists) return;
        const teamId = chunkTeamIds[chunkIndex];
        if (teamId) memberTeamIds.add(teamId);
      });
    }

    const teams = teamItems
      .filter((item) => captainTeamIds.has(item.id) || memberTeamIds.has(item.id))
      .map((item) => ({
        id: item.id,
        ...item.data,
        isCaptain: item.data['captainUid'] === normalizedUid,
      }));

    return this.enrichTeamsForResponse(teams);
  }

  async listMyTeams(uid: string) {
    const normalizedUid = this.parseUid(uid, 'uid');

    try {
      const memberEntries = await firestore
        .collectionGroup('members')
        .where('uid', '==', normalizedUid)
        .get();

      if (memberEntries.empty) return [];

      const teamIds = Array.from(
        new Set(
          memberEntries.docs
            .map((entry) => entry.ref.parent.parent?.id ?? null)
            .filter((id): id is string => !!id),
        ),
      );

      const teamDocs = await Promise.all(teamIds.map((id) => this.teamsCollection.doc(id).get()));

      const teams = teamDocs
        .filter((doc) => doc.exists)
        .map((doc) => {
          const data = (doc.data() ?? {}) as Record<string, unknown>;
          const team: Record<string, unknown> = {
            id: doc.id,
            ...data,
            isCaptain: data['captainUid'] === normalizedUid,
          };
          return team;
        })
        .sort((a, b) => {
          const aCreatedAt = new Date(String(a['createdAt'] ?? '')).getTime();
          const bCreatedAt = new Date(String(b['createdAt'] ?? '')).getTime();

          if (!Number.isFinite(aCreatedAt) && !Number.isFinite(bCreatedAt)) return 0;
          if (!Number.isFinite(aCreatedAt)) return 1;
          if (!Number.isFinite(bCreatedAt)) return -1;
          return bCreatedAt - aCreatedAt;
        });

      return this.enrichTeamsForResponse(teams);
    } catch (error: unknown) {
      if (!this.isFailedPreconditionError(error)) throw error;
      return this.listMyTeamsWithoutCollectionGroup(normalizedUid);
    }
  }

  async listMyPendingInvites(uid: string) {
    const normalizedUid = this.parseUid(uid, 'uid');

    const inviteEntries = await firestore
      .collectionGroup('invites')
      .where('uid', '==', normalizedUid)
      .get();

    if (inviteEntries.empty) return [];

    const pendingInvites = inviteEntries.docs.filter((doc) => {
      const inviteData = doc.data() as { status?: unknown };
      return inviteData.status === 'pending';
    });

    const inviteItems = pendingInvites
      .map((doc) => {
        const teamId = doc.ref.parent.parent?.id ?? '';
        return {
          teamId,
          inviteId: doc.id,
          ...(doc.data() as Record<string, unknown>),
        };
      })
      .filter((item) => typeof item.teamId === 'string' && item.teamId.trim());

    const teamIds = Array.from(new Set(inviteItems.map((item) => item.teamId)));

    const teamSnapshots = await Promise.all(teamIds.map((teamId) => this.teamsCollection.doc(teamId).get()));
    const teams = teamSnapshots
      .filter((snap) => snap.exists)
      .map((snap) => ({
        id: snap.id,
        ...((snap.data() ?? {}) as Record<string, unknown>),
      }));

    const enrichedTeams = await this.enrichTeamsForResponse(teams);
    const teamsById = new Map<string, Record<string, unknown>>();
    for (const team of enrichedTeams) {
      const teamId = this.normalizeOptionalUid(team['id']);
      if (!teamId) continue;

      teamsById.set(teamId, team);
    }

    return inviteItems.map((item) => ({
      ...item,
      team: teamsById.get(item.teamId) ?? null,
    }));
  }

  private normalizeTournamentStatus(value: unknown): string {
    return (this.normalizeOptionalString(value) ?? 'desconhecido').toLowerCase();
  }

  private resolveTournamentParticipationScope(status: string): ParticipationScope {
    if (status === 'finished' || status === 'canceled') return 'participou';
    return 'participa';
  }

  private resolveTournamentParticipationLabel(scope: ParticipationScope): string {
    return scope === 'participou' ? 'Participou' : 'Participa';
  }

  private readStringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    const labels: string[] = [];
    for (const item of value) {
      if (typeof item === 'string') {
        const normalized = item.trim();
        if (normalized) labels.push(normalized);
        continue;
      }

      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const raw = item as Record<string, unknown>;
      const label =
        this.normalizeOptionalString(raw['label']) ??
        this.normalizeOptionalString(raw['title']) ??
        this.normalizeOptionalString(raw['name']);
      if (label) labels.push(label);
    }

    return labels;
  }

  private resolveTrophyLabels(
    teamId: string,
    tournamentData: Record<string, unknown>,
    teamEntryData: Record<string, unknown>,
  ): string[] {
    const labels = new Set<string>();

    for (const field of ['trophy', 'trophyLabel', 'resultLabel', 'award']) {
      const value =
        this.normalizeOptionalString(teamEntryData[field]) ??
        this.normalizeOptionalString(tournamentData[field]);
      if (value) labels.add(value);
    }

    for (const field of ['trophies', 'trophyLabels', 'awards']) {
      for (const label of this.readStringList(teamEntryData[field])) {
        labels.add(label);
      }
      for (const label of this.readStringList(tournamentData[field])) {
        labels.add(label);
      }
    }

    const placement =
      this.normalizeOptionalInteger(teamEntryData['placement']) ??
      this.normalizeOptionalInteger(teamEntryData['place']) ??
      this.normalizeOptionalInteger(teamEntryData['position']) ??
      this.normalizeOptionalInteger(teamEntryData['finalPosition']);

    if (placement === 1) labels.add('Campeao');
    if (placement === 2) labels.add('Vice-campeao');
    if (placement === 3) labels.add('3o lugar');

    const isWinner =
      this.normalizeOptionalBoolean(teamEntryData['isChampion']) === true ||
      this.normalizeOptionalBoolean(teamEntryData['isWinner']) === true ||
      this.normalizeOptionalBoolean(teamEntryData['winner']) === true;
    if (isWinner) labels.add('Campeao');

    const winnerTeamId =
      this.normalizeOptionalUid(tournamentData['winnerTeamId']) ??
      this.normalizeOptionalUid(tournamentData['championTeamId']);
    if (winnerTeamId && winnerTeamId === teamId) {
      labels.add('Campeao');
    }

    return Array.from(labels);
  }

  private resolveTrophyIcon(label: string): string {
    const normalized = label.trim().toLowerCase();
    if (!normalized) return '🏅';
    if (normalized.includes('campe')) return '🏆';
    if (normalized.includes('vice')) return '🥈';
    if (normalized.includes('3')) return '🥉';
    if (normalized.includes('ouro')) return '🥇';
    if (normalized.includes('prata')) return '🥈';
    if (normalized.includes('bronze')) return '🥉';
    return '🏅';
  }

  async listTeamTournaments(teamId: string): Promise<TeamTournamentsOverview> {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    const teamSnapshot = await this.teamsCollection.doc(normalizedTeamId).get();
    if (!teamSnapshot.exists) {
      fail('Time nao encontrado.', 404);
    }

    const tournamentsSnapshot = await firestore
      .collection('tournaments')
      .orderBy('startAt', 'desc')
      .get();

    const tournamentItems = await Promise.all(
      tournamentsSnapshot.docs.map(async (tournamentDoc) => {
        const teamDoc = await tournamentDoc.ref.collection('teams').doc(normalizedTeamId).get();
        if (!teamDoc.exists) return null;

        const tournamentData = (tournamentDoc.data() ?? {}) as Record<string, unknown>;
        const teamEntryData = (teamDoc.data() ?? {}) as Record<string, unknown>;
        const status = this.normalizeTournamentStatus(tournamentData['status']);
        const participationScope = this.resolveTournamentParticipationScope(status);
        const trophyLabels = this.resolveTrophyLabels(
          normalizedTeamId,
          tournamentData,
          teamEntryData,
        );

        const summary: TeamTournamentSummary = {
          id: tournamentDoc.id,
          name: this.normalizeOptionalString(tournamentData['name']) ?? `Torneio ${tournamentDoc.id}`,
          status,
          teamMode: this.normalizeOptionalString(tournamentData['teamMode']) ?? 'desconhecido',
          checkedIn: this.normalizeOptionalBoolean(teamEntryData['checkedIn']) ?? false,
          startAt: this.normalizeOptionalString(tournamentData['startAt']),
          checkinDeadlineAt: this.normalizeOptionalString(tournamentData['checkinDeadlineAt']),
          participationScope,
          participationLabel: this.resolveTournamentParticipationLabel(participationScope),
          trophyLabels,
        };

        const trophies = trophyLabels.map((label) => ({
          tournamentId: tournamentDoc.id,
          tournamentName: summary.name,
          label,
          icon: this.resolveTrophyIcon(label),
        }));

        return { summary, trophies };
      }),
    );

    const tournaments: TeamTournamentSummary[] = [];
    const trophiesByKey = new Map<string, TeamTrophySummary>();

    for (const item of tournamentItems) {
      if (!item) continue;
      tournaments.push(item.summary);

      for (const trophy of item.trophies) {
        const key = `${trophy.tournamentId}::${trophy.label.toLowerCase()}`;
        if (!trophiesByKey.has(key)) {
          trophiesByKey.set(key, trophy);
        }
      }
    }

    return {
      teamId: normalizedTeamId,
      tournaments,
      trophies: Array.from(trophiesByKey.values()),
    };
  }

  private async assertCanAddMember(
    tx: FirebaseFirestore.Transaction,
    teamId: string,
    actorUid: string,
    actorRole: ActorRole,
    teamData: Record<string, unknown>,
  ): Promise<'direct_add' | 'invite_only'> {
    if (actorRole === UserRole.ADMIN || actorRole === UserRole.STREAMER) return 'direct_add';

    const actorMemberRef = this.membersCol(teamId).doc(actorUid);
    const actorMemberSnapshot = await tx.get(actorMemberRef);
    const isCaptain = actorMemberSnapshot.exists && teamData['captainUid'] === actorUid;

    if (!isCaptain) {
      fail('Apenas o capitao (ou admin/streamer) pode adicionar membros.', 403);
    }

    const category = String(teamData['category'] ?? '').trim().toLowerCase();
    if (category === 'random') {
      fail('Capitaes de times random nao podem adicionar membros.', 403);
    }

    return 'invite_only';
  }

  private readDirectTargetUid(body: AddMemberDto | TransferCaptainDto): string | null {
    const uidValue = body?.uid ?? body?.userId;
    if (uidValue == null) return null;
    return this.parseUid(uidValue, 'uid');
  }

  private async resolveAddMemberTarget(body: AddMemberDto): Promise<{
    targetUid: string;
    battletag: string | null;
  }> {
    const directUid = this.readDirectTargetUid(body);
    if (directUid) {
      return {
        targetUid: directUid,
        battletag: this.normalizeOptionalString(body?.battletag),
      };
    }

    const battletagInput = body?.battletag;
    if (battletagInput != null) {
      const found = await this.findUserByBattletag(this.parseBattletag(battletagInput));
      return {
        targetUid: found.uid,
        battletag: found.battletag,
      };
    }

    fail('Informe uid, userId ou battletag.', 400);
  }

  async addMember(teamId: string, actor: TeamActor, body: AddMemberDto) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    const actorUid = this.parseUid(actor.uid, 'uid');
    const actorRole = this.parseRole(actor.role);
    const { targetUid, battletag } = await this.resolveAddMemberTarget(body);

    if (targetUid === actorUid) {
      fail('Voce ja faz parte da acao solicitada para este time.', 400);
    }

    await this.assertUserExists(targetUid);

    const teamRef = this.teamsCollection.doc(normalizedTeamId);
    const targetMemberRef = this.membersCol(normalizedTeamId).doc(targetUid);
    const inviteRef = this.invitesCol(normalizedTeamId).doc(targetUid);
    const now = new Date().toISOString();

    const action = await firestore.runTransaction(async (tx) => {
      const teamSnapshot = await tx.get(teamRef);
      if (!teamSnapshot.exists) {
        fail('Time nao encontrado.', 404);
      }

      const teamData = (teamSnapshot.data() ?? {}) as Record<string, unknown>;
      const membersCount = this.toNonNegativeInt(teamData['membersCount']);

      const permission = await this.assertCanAddMember(
        tx,
        normalizedTeamId,
        actorUid,
        actorRole,
        teamData,
      );

      const targetMemberSnapshot = await tx.get(targetMemberRef);
      if (targetMemberSnapshot.exists) {
        fail('Usuario ja pertence ao time.', 409);
      }

      if (permission === 'direct_add') {
        const memberDoc: StoredMember = {
          uid: targetUid,
          joinedAt: now,
          addedByUid: actorUid,
          addedByRole: actorRole,
          source: 'admin_add',
        };

        tx.set(targetMemberRef, memberDoc);
        tx.update(teamRef, {
          membersCount: membersCount + 1,
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.delete(inviteRef);

        return 'added';
      }

      const inviteDoc: StoredInvite = {
        uid: targetUid,
        status: 'pending',
        invitedByUid: actorUid,
        invitedByRole: actorRole,
        invitedAt: now,
        updatedAt: now,
      };

      tx.set(inviteRef, inviteDoc, { merge: true });
      tx.update(teamRef, {
        updatedAt: FieldValue.serverTimestamp(),
      });

      return 'invited';
    });

    return {
      teamId: normalizedTeamId,
      uid: targetUid,
      battletag,
      action,
    };
  }

  async acceptInvite(teamId: string, uid: string) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    const normalizedUid = this.parseUid(uid, 'uid');

    const teamRef = this.teamsCollection.doc(normalizedTeamId);
    const memberRef = this.membersCol(normalizedTeamId).doc(normalizedUid);
    const inviteRef = this.invitesCol(normalizedTeamId).doc(normalizedUid);
    const now = new Date().toISOString();

    await firestore.runTransaction(async (tx) => {
      const teamSnapshot = await tx.get(teamRef);
      if (!teamSnapshot.exists) {
        fail('Time nao encontrado.', 404);
      }

      const teamData = (teamSnapshot.data() ?? {}) as Record<string, unknown>;
      const membersCount = this.toNonNegativeInt(teamData['membersCount']);

      const memberSnapshot = await tx.get(memberRef);
      if (memberSnapshot.exists) {
        fail('Usuario ja pertence ao time.', 409);
      }

      const inviteSnapshot = await tx.get(inviteRef);
      if (!inviteSnapshot.exists) {
        fail('Convite nao encontrado.', 404);
      }

      const invite = (inviteSnapshot.data() ?? {}) as Record<string, unknown>;
      if (invite['status'] !== 'pending') {
        fail('Convite nao esta mais pendente.', 400);
      }

      const invitedByUid = this.parseUid(invite['invitedByUid'], 'invitedByUid');
      const invitedByRole = this.parseRole(invite['invitedByRole']);

      const acceptedMemberDoc: StoredMember = {
        uid: normalizedUid,
        joinedAt: now,
        addedByUid: invitedByUid,
        addedByRole: invitedByRole,
        source: 'invite_accept',
      };

      tx.set(memberRef, acceptedMemberDoc);
      tx.delete(inviteRef);
      tx.update(teamRef, {
        membersCount: membersCount + 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const updatedMember = await memberRef.get();
    return { id: updatedMember.id, ...updatedMember.data() };
  }

  async rejectInvite(teamId: string, uid: string) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    const normalizedUid = this.parseUid(uid, 'uid');
    const inviteRef = this.invitesCol(normalizedTeamId).doc(normalizedUid);
    const teamRef = this.teamsCollection.doc(normalizedTeamId);

    await firestore.runTransaction(async (tx) => {
      const teamSnapshot = await tx.get(teamRef);
      if (!teamSnapshot.exists) {
        fail('Time nao encontrado.', 404);
      }

      const inviteSnapshot = await tx.get(inviteRef);
      if (!inviteSnapshot.exists) {
        fail('Convite nao encontrado.', 404);
      }

      const invite = (inviteSnapshot.data() ?? {}) as Record<string, unknown>;
      if (invite['status'] !== 'pending') {
        fail('Convite nao esta mais pendente.', 400);
      }

      tx.delete(inviteRef);
      tx.update(teamRef, {
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return {
      teamId: normalizedTeamId,
      uid: normalizedUid,
      status: 'rejected',
    };
  }

  async leaveTeam(teamId: string, uid: string) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    const normalizedUid = this.parseUid(uid, 'uid');

    const teamRef = this.teamsCollection.doc(normalizedTeamId);
    const memberRef = this.membersCol(normalizedTeamId).doc(normalizedUid);

    await firestore.runTransaction(async (tx) => {
      const teamSnapshot = await tx.get(teamRef);
      if (!teamSnapshot.exists) {
        fail('Time nao encontrado.', 404);
      }

      const teamData = (teamSnapshot.data() ?? {}) as Record<string, unknown>;
      const membersCount = this.toNonNegativeInt(teamData['membersCount']);

      const memberSnapshot = await tx.get(memberRef);
      if (!memberSnapshot.exists) {
        fail('Usuario nao pertence ao time.', 400);
      }

      const nextCount = membersCount > 0 ? membersCount - 1 : 0;
      const updates: Record<string, unknown> = {
        membersCount: nextCount,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (teamData['captainUid'] === normalizedUid) {
        const membersSnapshot = await tx.get(this.membersCol(normalizedTeamId));
        const remainingMemberIds = membersSnapshot.docs
          .map((doc) => doc.id)
          .filter((memberId) => memberId !== normalizedUid);

        if (!remainingMemberIds.length) {
          updates['captainUid'] = null;
        } else {
          const randomIndex = Math.floor(Math.random() * remainingMemberIds.length);
          updates['captainUid'] = remainingMemberIds[randomIndex];
        }
      }

      tx.delete(memberRef);
      tx.update(teamRef, updates);
    });

    const updated = await teamRef.get();
    return this.enrichTeamForResponse({
      id: updated.id,
      ...(updated.data() as Record<string, unknown>),
    });
  }

  async removeMemberAsAdmin(teamId: string, actor: TeamActor, memberUid: string) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    const adminUid = this.parseUid(actor.uid, 'uid');
    const adminRole = this.parseRole(actor.role);
    const normalizedMemberUid = this.parseUid(memberUid, 'memberUid');

    if (adminRole !== UserRole.ADMIN) {
      fail('Apenas admin pode remover membros.', 403);
    }

    const teamRef = this.teamsCollection.doc(normalizedTeamId);
    const memberRef = this.membersCol(normalizedTeamId).doc(normalizedMemberUid);
    const inviteRef = this.invitesCol(normalizedTeamId).doc(normalizedMemberUid);

    await firestore.runTransaction(async (tx) => {
      const teamSnapshot = await tx.get(teamRef);
      if (!teamSnapshot.exists) {
        fail('Time nao encontrado.', 404);
      }

      const teamData = (teamSnapshot.data() ?? {}) as Record<string, unknown>;
      const teamCategory = String(teamData['category'] ?? '').trim().toLowerCase();
      if (teamCategory !== 'random') {
        fail('Admin so pode remover membros de times random.', 403);
      }

      const membersCount = this.toNonNegativeInt(teamData['membersCount']);
      const memberSnapshot = await tx.get(memberRef);
      if (!memberSnapshot.exists) {
        fail('Membro nao encontrado neste time.', 404);
      }

      const nextCount = membersCount > 0 ? membersCount - 1 : 0;
      const updates: Record<string, unknown> = {
        membersCount: nextCount,
        updatedAt: FieldValue.serverTimestamp(),
        updatedByUid: adminUid,
      };

      if (teamData['captainUid'] === normalizedMemberUid) {
        const membersSnapshot = await tx.get(this.membersCol(normalizedTeamId));
        const remainingMemberIds = membersSnapshot.docs
          .map((doc) => doc.id)
          .filter((id) => id !== normalizedMemberUid);

        updates['captainUid'] = remainingMemberIds.length ? remainingMemberIds[0] : null;
      }

      tx.delete(memberRef);
      tx.delete(inviteRef);
      tx.update(teamRef, updates);
    });

    const updated = await teamRef.get();
    return this.enrichTeamForResponse({
      id: updated.id,
      ...(updated.data() as Record<string, unknown>),
    });
  }

  async transferCaptain(teamId: string, actor: TeamActor, body: TransferCaptainDto) {
    const normalizedTeamId = this.parseUid(teamId, 'teamId');
    const normalizedActorUid = this.parseUid(actor.uid, 'uid');
    const actorRole = this.parseRole(actor.role);
    const targetUid = this.readDirectTargetUid(body);
    if (!targetUid) {
      fail('Informe uid ou userId do novo capitao.', 400);
    }

    const teamRef = this.teamsCollection.doc(normalizedTeamId);
    const targetMemberRef = this.membersCol(normalizedTeamId).doc(targetUid);

    await firestore.runTransaction(async (tx) => {
      const teamSnapshot = await tx.get(teamRef);
      if (!teamSnapshot.exists) {
        fail('Time nao encontrado.', 404);
      }

      const teamData = (teamSnapshot.data() ?? {}) as Record<string, unknown>;
      const actorIsAdmin = actorRole === UserRole.ADMIN;
      if (!actorIsAdmin && teamData['captainUid'] !== normalizedActorUid) {
        fail('Somente o capitao atual ou admin pode transferir a capitania.', 403);
      }

      const targetMemberSnapshot = await tx.get(targetMemberRef);
      if (!targetMemberSnapshot.exists) {
        fail('Novo capitao precisa ser membro do time.', 400);
      }

      tx.update(teamRef, {
        captainUid: targetUid,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const updated = await teamRef.get();
    return this.enrichTeamForResponse({
      id: updated.id,
      ...(updated.data() as Record<string, unknown>),
    });
  }
}

export const timesSvc = new TimesService();
