import { firestore } from '../firebase';
import { generateDoubleEliminationTemplate } from './generators/double-elimination.generator';
import {
  BracketStatus,
  CreateBracketDto,
  MatchStatus,
  ReportMatchDto,
  SeedMode,
  StoredBracket,
  StoredMatch,
} from './interfaces';

const VALID_TEAM_COUNTS = new Set([4, 8, 16, 32]);
const DEFAULT_LOGO_BUCKET = 'copa-nova-era-overwatch.firebasestorage.app';

/**
 * Gera a URL pública de acesso à logo a partir do logoPath armazenado no Firestore.
 * Suporta: gs:// URI, URL HTTPS completa, e caminho relativo.
 * Respeita FIREBASE_STORAGE_EMULATOR_HOST quando rodando localmente.
 */
function buildLogoUrl(
  logoPath: string | null | undefined,
  logoBucketName: string | null | undefined,
): string | null {
  if (!logoPath || typeof logoPath !== 'string') return null;
  const path = logoPath.trim();
  if (!path) return null;

  // Já é uma URL completa
  if (path.startsWith('https://') || path.startsWith('http://')) {
    return path.includes('?alt=media') ? path : `${path}?alt=media`;
  }

  let bucket: string;
  let objectPath: string;

  // gs:// URI → extrai bucket e objectPath
  if (path.startsWith('gs://')) {
    const withoutScheme = path.slice('gs://'.length);
    const slashIndex = withoutScheme.indexOf('/');
    if (slashIndex <= 0) return null;
    bucket = withoutScheme.slice(0, slashIndex);
    objectPath = withoutScheme.slice(slashIndex + 1).replace(/^\/+/, '');
    if (!objectPath) return null;
  } else {
    // Caminho relativo — usa bucket do time ou padrão
    bucket =
      typeof logoBucketName === 'string' && logoBucketName.trim()
        ? logoBucketName.trim()
        : DEFAULT_LOGO_BUCKET;
    objectPath = path;
  }

  // Emulador local
  const emulatorHost = process.env['FIREBASE_STORAGE_EMULATOR_HOST'];
  if (emulatorHost) {
    const baseHost =
      emulatorHost.startsWith('http://') || emulatorHost.startsWith('https://')
        ? emulatorHost
        : `http://${emulatorHost}`;
    return `${baseHost}/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
  }

  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
}

function fisherYates<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class BracketsService {
  private bracketsCollection = firestore.collection('brackets');

  private tournamentsCollection = firestore.collection('tournaments');

  private teamsCol(tournamentId: string) {
    return this.tournamentsCollection.doc(tournamentId).collection('teams');
  }

  private matchesCol(tournamentId: string) {
    return this.bracketsCollection.doc(tournamentId).collection('matches');
  }

  // ──────────────────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────────────────

  async createBracket(tournamentId: string, dto: CreateBracketDto) {
    const seedMode = String(dto?.seedMode || '').trim() as SeedMode;
    if (seedMode !== 'manual' && seedMode !== 'random') {
      throw new Error('seedMode deve ser "manual" ou "random"');
    }

    // Valida torneio
    const tournamentSnap = await this.tournamentsCollection.doc(tournamentId).get();
    if (!tournamentSnap.exists) throw new Error(`Torneio ${tournamentId} não encontrado.`);

    const tournament = tournamentSnap.data() as any;
    if (tournament.status !== 'running') {
      throw new Error('O bracket só pode ser gerado quando o torneio está em status "running".');
    }

    const maxTeams: number = tournament.maxTeams;
    if (!VALID_TEAM_COUNTS.has(maxTeams)) {
      throw new Error(`maxTeams inválido (${maxTeams}). Use 4, 8, 16 ou 32.`);
    }

    // Valida que bracket não existe
    const existingBracket = await this.bracketsCollection.doc(tournamentId).get();
    if (existingBracket.exists) {
      throw new Error('Este torneio já possui um bracket. Delete-o primeiro.');
    }

    // Monta seedMap
    let orderedTeamIds: string[];
    let autoCheckinTeamIds: string[] = [];

    const rawIds = dto?.teamIds;
    const hasExplicitTeamIds = Array.isArray(rawIds) && (rawIds as unknown[]).length > 0;

    if (seedMode === 'manual') {
      if (!hasExplicitTeamIds) throw new Error('teamIds deve ser um array quando seedMode é "manual".');
      orderedTeamIds = (rawIds as unknown[]).map((id, i) => {
        if (typeof id !== 'string' || !id.trim()) throw new Error(`teamIds[${i}] inválido.`);
        return id.trim();
      });
      if (orderedTeamIds.length !== maxTeams) {
        throw new Error(`teamIds deve conter exatamente ${maxTeams} times (recebeu ${orderedTeamIds.length}).`);
      }
      // Times fornecidos explicitamente devem ser marcados como check-in (torneios random)
      autoCheckinTeamIds = orderedTeamIds;
    } else {
      if (hasExplicitTeamIds) {
        // Modo random com teamIds explícitos (vindos do preview do frontend):
        // usa a ordem fornecida sem re-embaralhar; o frontend já aplicou o Fisher-Yates.
        orderedTeamIds = (rawIds as unknown[]).map((id, i) => {
          if (typeof id !== 'string' || !id.trim()) throw new Error(`teamIds[${i}] inválido.`);
          return id.trim();
        });
        if (orderedTeamIds.length !== maxTeams) {
          throw new Error(`teamIds deve conter exatamente ${maxTeams} times (recebeu ${orderedTeamIds.length}).`);
        }
        // Auto check-in pois times random não fazem checkin manual
        autoCheckinTeamIds = orderedTeamIds;
      } else {
        // Fallback: lê times já com check-in no Firestore e embaralha
        const teamsSnap = await this.teamsCol(tournamentId).where('checkedIn', '==', true).get();
        if (teamsSnap.empty) throw new Error('Nenhum time com checkin encontrado no torneio.');
        orderedTeamIds = fisherYates(teamsSnap.docs.map((d) => d.id));
        if (orderedTeamIds.length !== maxTeams) {
          throw new Error(
            `Número de times com checkin (${orderedTeamIds.length}) não corresponde a maxTeams (${maxTeams}).`,
          );
        }
      }
    }

    const seedMap: Record<number, string> = {};
    orderedTeamIds.forEach((teamId, idx) => {
      seedMap[idx + 1] = teamId;
    });

    // Gera template e resolve partidas iniciais
    const templates = generateDoubleEliminationTemplate(maxTeams as 4 | 8 | 16 | 32);
    const now = new Date().toISOString();

    const bracketDoc: StoredBracket = {
      tournamentId,
      type: 'double-elimination',
      teamCount: maxTeams as 4 | 8 | 16 | 32,
      status: 'running' as BracketStatus,
      seedMap,
      winnerId: null,
      createdAt: now,
      updatedAt: now,
    };

    // Persiste bracket + partidas em batch
    const batch = firestore.batch();

    batch.set(this.bracketsCollection.doc(tournamentId), bracketDoc);

    // Auto check-in dos times selecionados (para torneios random que não fazem checkin manual)
    if (autoCheckinTeamIds.length > 0) {
      const teamsCol = this.teamsCol(tournamentId);
      for (const teamId of autoCheckinTeamIds) {
        batch.set(teamsCol.doc(teamId), { checkedIn: true, updatedAt: now }, { merge: true });
      }
    }

    for (const tpl of templates) {
      // Resolve slots do tipo seed para team IDs imediatamente
      let team1Id: string | null = null;
      let team2Id: string | null = null;

      if (tpl.slot1.type === 'seed') team1Id = seedMap[tpl.slot1.ref] ?? null;
      if (tpl.slot2.type === 'seed') team2Id = seedMap[tpl.slot2.ref] ?? null;

      const status: MatchStatus = team1Id && team2Id ? 'ready' : 'pending';

      const match: StoredMatch = {
        matchNumber: tpl.matchNumber,
        round: tpl.round,
        side: tpl.side,
        slot1: tpl.slot1,
        slot2: tpl.slot2,
        team1Id,
        team2Id,
        team1Score: null,
        team2Score: null,
        winnerId: null,
        loserId: null,
        status,
        createdAt: now,
        updatedAt: now,
      };

      batch.set(this.matchesCol(tournamentId).doc(String(tpl.matchNumber)), match);
    }

    await batch.commit();

    return { id: tournamentId, ...bracketDoc };
  }

  // ──────────────────────────────────────────────────────────
  // GET
  // ──────────────────────────────────────────────────────────

  async getBracket(tournamentId: string) {
    const bracketSnap = await this.bracketsCollection.doc(tournamentId).get();
    if (!bracketSnap.exists) throw new Error(`Bracket do torneio ${tournamentId} não encontrado.`);

    const bracketData = bracketSnap.data() as StoredBracket;
    const matchesSnap = await this.matchesCol(tournamentId).orderBy('matchNumber', 'asc').get();
    const matches = matchesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as StoredMatch) }));

    // Embed public team info (name + logoUrl) so unauthenticated clients can display teams
    const teamIds = Object.values(bracketData.seedMap).filter((id): id is string => !!id);
    const teamInfo: Record<string, { name: string; logoUrl: string | null }> = {};

    if (teamIds.length > 0) {
      const teamSnaps = await Promise.all(
        teamIds.map((id) => firestore.collection('teams').doc(id).get()),
      );
      for (const snap of teamSnaps) {
        if (!snap.exists) continue;
        const data = snap.data() as Record<string, unknown>;
        const name = typeof data?.name === 'string' ? data.name.trim() : 'Time sem nome';
        const logoPath = typeof data?.logoPath === 'string' ? data.logoPath : null;
        const logoBucketName =
          typeof data?.logoBucketName === 'string' ? data.logoBucketName :
          typeof data?.logoBucket === 'string' ? data.logoBucket : null;
        const logoUrl = buildLogoUrl(logoPath, logoBucketName);
        teamInfo[snap.id] = { name, logoUrl };
      }
    }

    return { id: tournamentId, ...bracketData, matches, teamInfo };
  }

  // ──────────────────────────────────────────────────────────
  // REPORT RESULT
  // ──────────────────────────────────────────────────────────

  async reportMatchResult(tournamentId: string, matchNumber: number, dto: ReportMatchDto) {
    const winnerId = typeof dto?.winnerId === 'string' ? dto.winnerId.trim() : null;
    if (!winnerId) throw new Error('winnerId é obrigatório.');
    const walkover = dto?.walkover === true;

    const matchRef = this.matchesCol(tournamentId).doc(String(matchNumber));
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) throw new Error(`Partida ${matchNumber} não encontrada no bracket ${tournamentId}.`);

    const match = matchSnap.data() as StoredMatch;

    if (match.status !== 'ready' && match.status !== 'running') {
      throw new Error(`A partida ${matchNumber} está "${match.status}" e não pode receber resultado.`);
    }
    if (!match.team1Id || !match.team2Id) {
      throw new Error(`A partida ${matchNumber} ainda não tem os dois times definidos.`);
    }
    if (winnerId !== match.team1Id && winnerId !== match.team2Id) {
      throw new Error(`winnerId "${winnerId}" não é um dos times desta partida.`);
    }

    const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;

    // Placar opcional — ignorado em W.O.
    const team1Score = walkover ? null : this.parseOptionalScore(dto?.team1Score);
    const team2Score = walkover ? null : this.parseOptionalScore(dto?.team2Score);

    // Carrega todas as partidas para propagar resultado
    const allMatchesSnap = await this.matchesCol(tournamentId).get();
    const allMatches = allMatchesSnap.docs.map((d) => ({
      ref: d.ref,
      data: d.data() as StoredMatch,
    }));

    const now = new Date().toISOString();
    const batch = firestore.batch();

    // Finaliza a partida atual
    batch.update(matchRef, {
      winnerId,
      loserId,
      team1Score: team1Score ?? null,
      team2Score: team2Score ?? null,
      walkover,
      status: 'finished' as MatchStatus,
      updatedAt: now,
    });

    // Propaga para partidas dependentes
    const bracketRef = this.bracketsCollection.doc(tournamentId);
    let bracketWinnerId: string | null = null;

    for (const { ref, data: m } of allMatches) {
      if (m.matchNumber === matchNumber) continue;
      if (m.status === 'finished') continue;

      let newTeam1Id = m.team1Id;
      let newTeam2Id = m.team2Id;

      if (m.slot1.type === 'winner_of' && m.slot1.ref === matchNumber) newTeam1Id = winnerId;
      if (m.slot1.type === 'loser_of' && m.slot1.ref === matchNumber) newTeam1Id = loserId;
      if (m.slot2.type === 'winner_of' && m.slot2.ref === matchNumber) newTeam2Id = winnerId;
      if (m.slot2.type === 'loser_of' && m.slot2.ref === matchNumber) newTeam2Id = loserId;

      const changed = newTeam1Id !== m.team1Id || newTeam2Id !== m.team2Id;
      if (!changed) continue;

      const newStatus: MatchStatus = newTeam1Id && newTeam2Id ? 'ready' : 'pending';
      batch.update(ref, { team1Id: newTeam1Id, team2Id: newTeam2Id, status: newStatus, updatedAt: now });
    }

    // Se for a grande final, encerra o bracket
    const bracketSnap = await bracketRef.get();
    if (bracketSnap.exists) {
      const bracket = bracketSnap.data() as StoredBracket;
      const templates = generateDoubleEliminationTemplate(bracket.teamCount);
      const grandFinal = templates.find((t) => t.side === 'grand-final');

      if (grandFinal && grandFinal.matchNumber === matchNumber) {
        bracketWinnerId = winnerId;
        batch.update(bracketRef, {
          status: 'finished' as BracketStatus,
          winnerId: bracketWinnerId,
          updatedAt: now,
        });
      }
    }

    await batch.commit();

    return {
      matchNumber,
      winnerId,
      loserId,
      bracketFinished: bracketWinnerId !== null,
      bracketWinnerId,
    };
  }

  // ──────────────────────────────────────────────────────────
  // UPDATE SEEDS
  // ──────────────────────────────────────────────────────────

  async updateSeeds(tournamentId: string, newSeedMap: Record<number, string>) {
    const bracketRef = this.bracketsCollection.doc(tournamentId);
    const bracketSnap = await bracketRef.get();
    if (!bracketSnap.exists) throw new Error(`Bracket do torneio ${tournamentId} não encontrado.`);

    const bracket = bracketSnap.data() as StoredBracket;
    if (bracket.status !== 'running') {
      throw new Error('Só é possível reordenar seeds enquanto o bracket está em andamento.');
    }

    // Valida que o novo seedMap tem o mesmo tamanho
    const newEntries = Object.entries(newSeedMap);
    if (newEntries.length !== bracket.teamCount) {
      throw new Error(`seedMap deve conter exatamente ${bracket.teamCount} entries (recebeu ${newEntries.length}).`);
    }

    // Valida que contém exatamente os mesmos teamIds (apenas reordenados)
    const oldIds = new Set(Object.values(bracket.seedMap));
    const newIds = new Set(Object.values(newSeedMap));
    if (oldIds.size !== newIds.size || [...oldIds].some((id) => !newIds.has(id))) {
      throw new Error('O novo seedMap deve conter exatamente os mesmos times do seedMap atual.');
    }

    // Valida que todas as keys são seeds válidos (1..teamCount)
    for (const [key, value] of newEntries) {
      const seedNum = Number(key);
      if (!Number.isInteger(seedNum) || seedNum < 1 || seedNum > bracket.teamCount) {
        throw new Error(`Seed inválido: ${key}. Deve ser entre 1 e ${bracket.teamCount}.`);
      }
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`teamId inválido para seed ${key}.`);
      }
    }

    // Carrega partidas da WB R1
    const allMatchesSnap = await this.matchesCol(tournamentId).get();
    const wbR1Matches = allMatchesSnap.docs
      .map((d) => ({ ref: d.ref, data: d.data() as StoredMatch }))
      .filter((m) => m.data.side === 'winners' && m.data.round === 1);

    // Valida que nenhuma partida da WB R1 foi reportada ou está em andamento
    for (const m of wbR1Matches) {
      if (m.data.status === 'finished' || m.data.status === 'running') {
        throw new Error(
          `A partida ${m.data.matchNumber} já foi reportada ou está em andamento. Não é possível reordenar.`,
        );
      }
    }

    // Normaliza seedMap com keys numéricas
    const normalizedSeedMap: Record<number, string> = {};
    for (const [key, value] of newEntries) {
      normalizedSeedMap[Number(key)] = (value as string).trim();
    }

    const now = new Date().toISOString();
    const batch = firestore.batch();

    // Atualiza seedMap no bracket
    batch.update(bracketRef, { seedMap: normalizedSeedMap, updatedAt: now });

    // Re-resolve team1Id/team2Id nas partidas da WB R1
    for (const { ref, data: m } of wbR1Matches) {
      const newTeam1Id = m.slot1.type === 'seed' ? (normalizedSeedMap[m.slot1.ref] ?? null) : m.team1Id;
      const newTeam2Id = m.slot2.type === 'seed' ? (normalizedSeedMap[m.slot2.ref] ?? null) : m.team2Id;
      const newStatus: MatchStatus = newTeam1Id && newTeam2Id ? 'ready' : 'pending';

      batch.update(ref, {
        team1Id: newTeam1Id,
        team2Id: newTeam2Id,
        status: newStatus,
        updatedAt: now,
      });
    }

    await batch.commit();
  }

  // ──────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────

  async deleteBracket(tournamentId: string) {
    const bracketSnap = await this.bracketsCollection.doc(tournamentId).get();
    if (!bracketSnap.exists) throw new Error(`Bracket do torneio ${tournamentId} não encontrado.`);

    const matchesSnap = await this.matchesCol(tournamentId).get();
    const batch = firestore.batch();

    for (const doc of matchesSnap.docs) {
      batch.delete(doc.ref);
    }
    batch.delete(this.bracketsCollection.doc(tournamentId));

    await batch.commit();
  }

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  private parseOptionalScore(value: unknown): number | null {
    if (value === undefined || value === null) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
      throw new Error(`Placar inválido: ${value}. Use inteiro >= 0.`);
    }
    return n;
  }
}

export const bracketsSvc = new BracketsService();
