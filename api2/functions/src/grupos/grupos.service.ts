import { firestore } from '../firebase';
import { loadPublicTeamInfo } from '../_services/team-info.service';
import { bracketsSvc } from '../brackets/brackets.service';
import { assertValidGroups, groupLetter, splitIntoGroups } from './logic/group-split';
import { buildKnockoutPositions, QualifiedTeam } from './logic/knockout-seeding';
import { roundRobin } from './logic/round-robin';
import { computeStandings, hasBlockingTie, StandingRow, WALKOVER_SCORE } from './logic/standings';
import {
  CreateGroupStageDto,
  KnockoutFormat,
  ReportGroupMatchDto,
  StoredGroup,
  StoredGroupMatch,
  StoredGroupStage,
} from './interfaces';

function fisherYates<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class GruposService {
  private stagesCollection = firestore.collection('groupStages');

  private tournamentsCollection = firestore.collection('tournaments');

  private groupsCol(tournamentId: string) {
    return this.stagesCollection.doc(tournamentId).collection('groups');
  }

  private matchesCol(tournamentId: string) {
    return this.stagesCollection.doc(tournamentId).collection('matches');
  }

  private teamsCol(tournamentId: string) {
    return this.tournamentsCollection.doc(tournamentId).collection('teams');
  }

  // ──────────────────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────────────────

  async createGroupStage(tournamentId: string, dto: CreateGroupStageDto) {
    const tournament = await this.loadGroupsTournament(tournamentId);
    if (tournament.status !== 'running') {
      throw new Error('Os grupos só podem ser gerados quando o torneio está em status "running".');
    }

    const existing = await this.stagesCollection.doc(tournamentId).get();
    if (existing.exists) throw new Error('Este torneio já possui fase de grupos. Exclua-a primeiro.');

    let groups: string[][];
    let autoCheckinTeamIds: string[] = [];

    const rawGroups = dto?.groups;
    if (Array.isArray(rawGroups) && rawGroups.length > 0) {
      groups = rawGroups.map((group, g) => {
        if (!Array.isArray(group)) throw new Error(`groups[${g}] deve ser uma lista de times.`);
        return group.map((id, i) => {
          if (typeof id !== 'string' || !id.trim()) throw new Error(`groups[${g}][${i}] inválido.`);
          return id.trim();
        });
      });
      // Times escolhidos explicitamente entram com check-in (torneios random não fazem check-in manual)
      autoCheckinTeamIds = groups.flat();
    } else {
      const teamsSnap = await this.teamsCol(tournamentId).where('checkedIn', '==', true).get();
      if (teamsSnap.empty) throw new Error('Nenhum time com checkin encontrado no torneio.');
      groups = splitIntoGroups(fisherYates(teamsSnap.docs.map((d) => d.id)));
    }

    assertValidGroups(groups);

    const teamCount = groups.flat().length;
    const maxTeams = Number(tournament.maxTeams);
    if (Number.isInteger(maxTeams) && maxTeams > 0 && teamCount > maxTeams) {
      throw new Error(`O torneio aceita no máximo ${maxTeams} times (recebeu ${teamCount}).`);
    }

    const teamSnaps = await Promise.all(
      groups.flat().map((id) => firestore.collection('teams').doc(id).get()),
    );
    const missing = teamSnaps.filter((snap) => !snap.exists).map((snap) => snap.id);
    if (missing.length) throw new Error(`Times não encontrados: ${missing.join(', ')}.`);

    const now = new Date().toISOString();
    const stage: StoredGroupStage = {
      tournamentId,
      groupCount: groups.length,
      teamCount,
      knockoutFormat: this.readKnockoutFormat(tournament),
      createdAt: now,
      updatedAt: now,
    };

    // Partidas numeradas por rodada e, dentro dela, por grupo: a "Rodada 1" inteira vem primeiro.
    const fixtures = groups.flatMap((teamIds, g) =>
      roundRobin(teamIds).map((f) => ({ ...f, group: groupLetter(g) })),
    );
    fixtures.sort((a, b) => a.round - b.round || a.group.localeCompare(b.group));

    const batch = firestore.batch();
    batch.set(this.stagesCollection.doc(tournamentId), stage);

    groups.forEach((teamIds, g) => {
      const group: StoredGroup = { letter: groupLetter(g), teamIds, manualOrder: null };
      batch.set(this.groupsCol(tournamentId).doc(group.letter), group);
    });

    fixtures.forEach((f, i) => {
      const match: StoredGroupMatch = {
        matchNumber: i + 1,
        group: f.group,
        round: f.round,
        team1Id: f.team1Id,
        team2Id: f.team2Id,
        team1Score: null,
        team2Score: null,
        winnerId: null,
        walkover: false,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(this.matchesCol(tournamentId).doc(String(match.matchNumber)), match);
    });

    for (const teamId of autoCheckinTeamIds) {
      batch.set(this.teamsCol(tournamentId).doc(teamId), { checkedIn: true, updatedAt: now }, { merge: true });
    }

    await batch.commit();
    return this.getGroupStage(tournamentId);
  }

  // ──────────────────────────────────────────────────────────
  // GET
  // ──────────────────────────────────────────────────────────

  async getGroupStage(tournamentId: string) {
    const stageSnap = await this.stagesCollection.doc(tournamentId).get();
    if (!stageSnap.exists) throw new Error(`Fase de grupos do torneio ${tournamentId} não encontrada.`);
    const stage = stageSnap.data() as StoredGroupStage;

    const { groups, matches } = await this.loadGroupsAndMatches(tournamentId);
    const standingsByGroup = this.standingsByGroup(groups, matches);

    const allMatchesFinished = matches.every((m) => m.status === 'finished');
    const blockingTieGroups = groups
      .filter((g) => hasBlockingTie(standingsByGroup.get(g.letter)!))
      .map((g) => g.letter);

    const [bracketSnap, teamInfo] = await Promise.all([
      firestore.collection('brackets').doc(tournamentId).get(),
      loadPublicTeamInfo(groups.flatMap((g) => g.teamIds)),
    ]);

    return {
      id: tournamentId,
      ...stage,
      groups: groups.map((g) => ({ ...g, standings: standingsByGroup.get(g.letter)! })),
      matches,
      teamInfo,
      allMatchesFinished,
      blockingTieGroups: allMatchesFinished ? blockingTieGroups : [],
      knockoutGenerated: bracketSnap.exists,
    };
  }

  // ──────────────────────────────────────────────────────────
  // REPORT RESULT
  // ──────────────────────────────────────────────────────────

  /** Registra ou corrige o resultado. Correções valem até o mata-mata ser gerado. */
  async reportMatchResult(tournamentId: string, matchNumber: number, dto: ReportGroupMatchDto) {
    await this.assertKnockoutNotGenerated(tournamentId);

    const matchRef = this.matchesCol(tournamentId).doc(String(matchNumber));
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) throw new Error(`Partida ${matchNumber} não encontrada na fase de grupos.`);
    const match = matchSnap.data() as StoredGroupMatch;

    const walkover = dto?.walkover === true;
    let team1Score: number;
    let team2Score: number;
    let winnerId: string;

    if (walkover) {
      const rawWinner = typeof dto?.winnerId === 'string' ? dto.winnerId.trim() : '';
      if (rawWinner !== match.team1Id && rawWinner !== match.team2Id) {
        throw new Error('No W.O., winnerId deve ser um dos times da partida.');
      }
      winnerId = rawWinner;
      const team1Won = winnerId === match.team1Id;
      team1Score = team1Won ? WALKOVER_SCORE.winner : WALKOVER_SCORE.loser;
      team2Score = team1Won ? WALKOVER_SCORE.loser : WALKOVER_SCORE.winner;
    } else {
      team1Score = this.parseRequiredScore(dto?.team1Score, 'team1Score');
      team2Score = this.parseRequiredScore(dto?.team2Score, 'team2Score');
      if (team1Score === team2Score) {
        throw new Error('Não existe empate: o placar precisa ter um vencedor.');
      }
      winnerId = team1Score > team2Score ? match.team1Id : match.team2Id;
    }

    const now = new Date().toISOString();
    const batch = firestore.batch();
    batch.update(matchRef, {
      team1Score,
      team2Score,
      winnerId,
      walkover,
      status: 'finished',
      updatedAt: now,
    });
    // Resultado novo pode mudar a tabela: a ordem manual antiga deixa de valer.
    batch.update(this.groupsCol(tournamentId).doc(match.group), { manualOrder: null });
    batch.update(this.stagesCollection.doc(tournamentId), { updatedAt: now });
    await batch.commit();

    return { matchNumber, winnerId, team1Score, team2Score, walkover };
  }

  // ──────────────────────────────────────────────────────────
  // MANUAL ORDER
  // ──────────────────────────────────────────────────────────

  async setManualOrder(tournamentId: string, letter: string, rawTeamIds: unknown) {
    await this.assertKnockoutNotGenerated(tournamentId);

    const groupRef = this.groupsCol(tournamentId).doc(letter);
    const groupSnap = await groupRef.get();
    if (!groupSnap.exists) throw new Error(`Grupo ${letter} não encontrado.`);
    const group = groupSnap.data() as StoredGroup;

    if (!Array.isArray(rawTeamIds)) throw new Error('teamIds deve ser uma lista.');
    const teamIds = rawTeamIds.map((id) => (typeof id === 'string' ? id.trim() : ''));
    const sameTeams =
      teamIds.length === group.teamIds.length &&
      new Set(teamIds).size === teamIds.length &&
      teamIds.every((id) => group.teamIds.includes(id));
    if (!sameTeams) throw new Error(`teamIds deve conter exatamente os times do grupo ${letter}.`);

    await groupRef.update({ manualOrder: teamIds });
  }

  // ──────────────────────────────────────────────────────────
  // KNOCKOUT
  // ──────────────────────────────────────────────────────────

  async generateKnockout(tournamentId: string) {
    const tournament = await this.loadGroupsTournament(tournamentId);
    const stageSnap = await this.stagesCollection.doc(tournamentId).get();
    if (!stageSnap.exists) throw new Error('Gere a fase de grupos antes do mata-mata.');

    const { groups, matches } = await this.loadGroupsAndMatches(tournamentId);
    const pending = matches.filter((m) => m.status !== 'finished').length;
    if (pending > 0) {
      throw new Error(`Ainda faltam ${pending} partida(s) da fase de grupos.`);
    }

    const standingsByGroup = this.standingsByGroup(groups, matches);
    const tied = groups.filter((g) => hasBlockingTie(standingsByGroup.get(g.letter)!)).map((g) => g.letter);
    if (tied.length) {
      throw new Error(`Empate sem desempate no(s) grupo(s) ${tied.join(', ')}. Defina a ordem manualmente.`);
    }

    const qualified: QualifiedTeam[] = groups.flatMap((g) =>
      standingsByGroup.get(g.letter)!.slice(0, 2).map((row) => ({
        teamId: row.teamId,
        group: g.letter,
        groupPosition: row.position as 1 | 2,
        played: row.played,
        wins: row.wins,
        roundDiff: row.roundDiff,
        roundsWon: row.roundsWon,
      })),
    );

    const knockoutFormat = this.readKnockoutFormat(tournament);
    const type = knockoutFormat === 'single_elimination' ? 'single-elimination' : 'double-elimination';
    return bracketsSvc.createFromGroups(tournamentId, type, buildKnockoutPositions(qualified));
  }

  // ──────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────

  async deleteGroupStage(tournamentId: string) {
    const stageSnap = await this.stagesCollection.doc(tournamentId).get();
    if (!stageSnap.exists) throw new Error(`Fase de grupos do torneio ${tournamentId} não encontrada.`);
    await this.assertKnockoutNotGenerated(tournamentId);

    const [groupsSnap, matchesSnap] = await Promise.all([
      this.groupsCol(tournamentId).get(),
      this.matchesCol(tournamentId).get(),
    ]);

    const batch = firestore.batch();
    for (const doc of [...groupsSnap.docs, ...matchesSnap.docs]) batch.delete(doc.ref);
    batch.delete(this.stagesCollection.doc(tournamentId));
    await batch.commit();
  }

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  private async loadGroupsTournament(tournamentId: string): Promise<Record<string, any>> {
    const snap = await this.tournamentsCollection.doc(tournamentId).get();
    if (!snap.exists) throw new Error(`Torneio ${tournamentId} não encontrado.`);
    const tournament = snap.data() as Record<string, any>;
    if (tournament.format !== 'groups') {
      throw new Error('Este torneio não usa fase de grupos.');
    }
    return tournament;
  }

  private readKnockoutFormat(tournament: Record<string, any>): KnockoutFormat {
    return tournament.knockoutFormat === 'single_elimination' ? 'single_elimination' : 'double_elimination';
  }

  private async assertKnockoutNotGenerated(tournamentId: string) {
    const bracketSnap = await firestore.collection('brackets').doc(tournamentId).get();
    if (bracketSnap.exists) {
      throw new Error('O mata-mata já foi gerado. Exclua a chave para alterar a fase de grupos.');
    }
  }

  private async loadGroupsAndMatches(tournamentId: string) {
    const [groupsSnap, matchesSnap] = await Promise.all([
      this.groupsCol(tournamentId).get(),
      this.matchesCol(tournamentId).orderBy('matchNumber', 'asc').get(),
    ]);
    const groups = groupsSnap.docs
      .map((d) => d.data() as StoredGroup)
      .sort((a, b) => a.letter.localeCompare(b.letter));
    const matches = matchesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as StoredGroupMatch) }));
    return { groups, matches };
  }

  private standingsByGroup(groups: readonly StoredGroup[], matches: readonly StoredGroupMatch[]) {
    const result = new Map<string, StandingRow[]>();
    for (const g of groups) {
      result.set(
        g.letter,
        computeStandings(g.teamIds, matches.filter((m) => m.group === g.letter), g.manualOrder),
      );
    }
    return result;
  }

  private parseRequiredScore(value: unknown, field: string): number {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${field} é obrigatório na fase de grupos.`);
    }
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) throw new Error(`Placar inválido: ${value}. Use inteiro >= 0.`);
    return n;
  }
}

export const gruposSvc = new GruposService();
