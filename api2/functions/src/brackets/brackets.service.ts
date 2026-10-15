import { firestore } from '../firebase';
import { loadPublicTeamInfo } from '../_services/team-info.service';
import {
  applyResult,
  BracketSize,
  buildMatches,
  EngineMatch,
  finalMatchNumber,
  findDeadSlots,
  templatesFor,
} from './engine/bracket-engine';
import {
  BracketStatus,
  BracketType,
  CreateBracketDto,
  MatchStatus,
  ReportMatchDto,
  SeedMode,
  StoredBracket,
  StoredMatch,
} from './interfaces';

const VALID_TEAM_COUNTS = new Set([4, 8, 16, 32]);

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
    if (tournament.format === 'groups') {
      throw new Error('Torneio com fase de grupos: o mata-mata é gerado a partir da classificação dos grupos.');
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

    const bracketDoc = await this.persistBracket(tournamentId, {
      type: 'double-elimination',
      size: maxTeams as BracketSize,
      seedMap,
      autoCheckinTeamIds,
    });

    return { id: tournamentId, ...bracketDoc };
  }

  /**
   * Gera o mata-mata de uma fase de grupos. `positions[i]` é o time da posição
   * i+1 da chave; `null` é bye. O tamanho já vem arredondado (4/8/16/32).
   */
  async createFromGroups(tournamentId: string, type: BracketType, positions: readonly (string | null)[]) {
    if (!VALID_TEAM_COUNTS.has(positions.length)) {
      throw new Error(`Tamanho de chave inválido (${positions.length}). Use 4, 8, 16 ou 32.`);
    }

    const existingBracket = await this.bracketsCollection.doc(tournamentId).get();
    if (existingBracket.exists) {
      throw new Error('Este torneio já possui um mata-mata. Exclua-o primeiro.');
    }

    const seedMap: Record<number, string> = {};
    positions.forEach((teamId, idx) => {
      if (teamId) seedMap[idx + 1] = teamId;
    });

    const bracketDoc = await this.persistBracket(tournamentId, {
      type,
      size: positions.length as BracketSize,
      seedMap,
      autoCheckinTeamIds: [],
      source: 'groups',
    });

    return { id: tournamentId, ...bracketDoc };
  }

  private async persistBracket(
    tournamentId: string,
    options: {
      type: BracketType;
      size: BracketSize;
      seedMap: Record<number, string>;
      autoCheckinTeamIds: readonly string[];
      source?: 'groups';
    },
  ): Promise<StoredBracket> {
    const { type, size, seedMap, autoCheckinTeamIds, source } = options;
    const templates = templatesFor(type, size);
    const engineMatches = buildMatches(templates, seedMap);
    const now = new Date().toISOString();

    const bracketDoc: StoredBracket = {
      tournamentId,
      type,
      teamCount: size,
      status: 'running' as BracketStatus,
      seedMap,
      winnerId: null,
      ...(source ? { source } : {}),
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
      const m = engineMatches.find((x) => x.matchNumber === tpl.matchNumber)!;
      const match: StoredMatch = {
        matchNumber: tpl.matchNumber,
        round: tpl.round,
        side: tpl.side,
        ...this.engineFields(m),
        createdAt: now,
        updatedAt: now,
      };

      batch.set(this.matchesCol(tournamentId).doc(String(tpl.matchNumber)), match);
    }

    await batch.commit();
    return bracketDoc;
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
    const teamInfo = await loadPublicTeamInfo(Object.values(bracketData.seedMap));

    return { id: tournamentId, ...bracketData, matches, teamInfo };
  }

  // ──────────────────────────────────────────────────────────
  // REPORT RESULT
  // ──────────────────────────────────────────────────────────

  async reportMatchResult(tournamentId: string, matchNumber: number, dto: ReportMatchDto) {
    const winnerId = typeof dto?.winnerId === 'string' ? dto.winnerId.trim() : null;
    if (!winnerId) throw new Error('winnerId é obrigatório.');
    const walkover = dto?.walkover === true;

    // Placar opcional — ignorado em W.O.
    const team1Score = walkover ? null : this.parseOptionalScore(dto?.team1Score);
    const team2Score = walkover ? null : this.parseOptionalScore(dto?.team2Score);

    const bracketRef = this.bracketsCollection.doc(tournamentId);
    const bracketSnap = await bracketRef.get();
    if (!bracketSnap.exists) throw new Error(`Bracket do torneio ${tournamentId} não encontrado.`);
    const bracket = bracketSnap.data() as StoredBracket;

    // Carrega todas as partidas para propagar resultado
    const allMatchesSnap = await this.matchesCol(tournamentId).get();
    const stored = allMatchesSnap.docs.map((d) => ({ ref: d.ref, data: d.data() as StoredMatch }));
    if (!stored.some((m) => m.data.matchNumber === matchNumber)) {
      throw new Error(`Partida ${matchNumber} não encontrada no bracket ${tournamentId}.`);
    }

    const templates = templatesFor(bracket.type ?? 'double-elimination', bracket.teamCount);
    const dead = findDeadSlots(templates, bracket.seedMap);
    const engineMatches: EngineMatch[] = stored.map(({ data }) => ({ ...data }));
    const before = new Map(engineMatches.map((m) => [m.matchNumber, JSON.stringify(this.engineFields(m))]));

    applyResult(engineMatches, dead, matchNumber, { winnerId, team1Score, team2Score, walkover });

    const now = new Date().toISOString();
    const batch = firestore.batch();

    // Persiste só as partidas que mudaram (a reportada + as que receberam times ou byes)
    for (const m of engineMatches) {
      const fields = this.engineFields(m);
      if (before.get(m.matchNumber) === JSON.stringify(fields)) continue;
      const ref = stored.find((x) => x.data.matchNumber === m.matchNumber)!.ref;
      batch.update(ref, { ...fields, updatedAt: now });
    }

    // Se for a final, encerra o bracket
    const finalMatch = engineMatches.find((m) => m.matchNumber === finalMatchNumber(templates));
    const bracketWinnerId = finalMatch?.status === 'finished' ? finalMatch.winnerId : null;
    if (bracketWinnerId) {
      batch.update(bracketRef, {
        status: 'finished' as BracketStatus,
        winnerId: bracketWinnerId,
        updatedAt: now,
      });
    }

    await batch.commit();

    const reported = engineMatches.find((m) => m.matchNumber === matchNumber)!;
    return {
      matchNumber,
      winnerId,
      loserId: reported.loserId,
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
    if (Object.keys(bracket.seedMap).length < bracket.teamCount) {
      throw new Error('Chave com bye não pode ter seeds reordenados: os byes já foram aplicados.');
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

  /** Campos da partida que o motor controla, sem undefined (Firestore rejeita). */
  private engineFields(m: EngineMatch) {
    return {
      slot1: m.slot1,
      slot2: m.slot2,
      team1Id: m.team1Id,
      team2Id: m.team2Id,
      team1Score: m.team1Score ?? null,
      team2Score: m.team2Score ?? null,
      winnerId: m.winnerId,
      loserId: m.loserId,
      walkover: m.walkover === true,
      bye: m.bye === true,
      status: m.status,
    };
  }

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
