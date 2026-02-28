import { FieldValue } from 'firebase-admin/firestore';
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

    const matchesSnap = await this.matchesCol(tournamentId).orderBy('matchNumber', 'asc').get();
    const matches = matchesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as StoredMatch) }));

    return { id: tournamentId, ...bracketSnap.data(), matches };
  }

  // ──────────────────────────────────────────────────────────
  // REPORT RESULT
  // ──────────────────────────────────────────────────────────

  async reportMatchResult(tournamentId: string, matchNumber: number, dto: ReportMatchDto) {
    const winnerId = typeof dto?.winnerId === 'string' ? dto.winnerId.trim() : null;
    if (!winnerId) throw new Error('winnerId é obrigatório.');

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

    // Placar opcional
    const team1Score = this.parseOptionalScore(dto?.team1Score);
    const team2Score = this.parseOptionalScore(dto?.team2Score);

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
