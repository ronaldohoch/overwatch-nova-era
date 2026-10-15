import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { Bracket, BracketTeamInfo } from '../brackets/brackets.service';

export type KnockoutFormat = 'double_elimination' | 'single_elimination';
export type GroupMatchStatus = 'pending' | 'finished';

export interface GroupMatch {
  readonly id: string;
  readonly matchNumber: number;
  readonly group: string;
  readonly round: number;
  readonly team1Id: string;
  readonly team2Id: string;
  readonly team1Score: number | null;
  readonly team2Score: number | null;
  readonly winnerId: string | null;
  readonly walkover: boolean;
  readonly status: GroupMatchStatus;
}

export interface StandingRow {
  readonly teamId: string;
  readonly position: number;
  readonly played: number;
  readonly wins: number;
  readonly losses: number;
  readonly points: number;
  readonly roundsWon: number;
  readonly roundsLost: number;
  readonly roundDiff: number;
  /** Empate que nenhum critério nem a ordem manual resolveu. */
  readonly tiedUnresolved: boolean;
}

export interface Group {
  readonly letter: string;
  readonly teamIds: string[];
  readonly manualOrder: string[] | null;
  readonly standings: StandingRow[];
}

export interface GroupStage {
  readonly id: string;
  readonly tournamentId: string;
  readonly groupCount: number;
  readonly teamCount: number;
  readonly knockoutFormat: KnockoutFormat;
  readonly groups: Group[];
  readonly matches: GroupMatch[];
  readonly teamInfo: Record<string, BracketTeamInfo>;
  readonly allMatchesFinished: boolean;
  /** Grupos com empate em aberto que decide classificação ou 1º/2º. */
  readonly blockingTieGroups: string[];
  readonly knockoutGenerated: boolean;
}

export interface ReportGroupMatchPayload {
  readonly team1Score?: number;
  readonly team2Score?: number;
  readonly walkover?: boolean;
  readonly winnerId?: string;
}

/** Quantos times passam de cada grupo. */
export const QUALIFIED_PER_GROUP = 2;

/** Tamanhos dos grupos para `teamCount` times: grupos de 4, completando com grupos de 3. */
export function groupSizes(teamCount: number): number[] {
  if (teamCount < 6) return [];
  const groupCount = Math.ceil(teamCount / 4);
  const groupsOfThree = groupCount * 4 - teamCount;
  return Array.from({ length: groupCount }, (_, i) => (i < groupCount - groupsOfThree ? 4 : 3));
}

export function groupLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index);
}

@Injectable({ providedIn: 'root' })
export class GruposService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly apiUrl = environment.apiURLGrupos;

  private authHeaders(): HttpHeaders {
    const token = this.auth.token();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  async createGroupStage(tournamentId: string, groups: string[][]): Promise<GroupStage> {
    return firstValueFrom(
      this.http.post<GroupStage>(`${this.apiUrl}/${tournamentId}`, { groups }, {
        headers: this.authHeaders(),
      }),
    );
  }

  async getGroupStage(tournamentId: string): Promise<GroupStage> {
    return firstValueFrom(
      this.http.get<GroupStage>(`${this.apiUrl}/${tournamentId}`, {
        headers: this.authHeaders(),
      }),
    );
  }

  async reportMatchResult(
    tournamentId: string,
    matchNumber: number,
    payload: ReportGroupMatchPayload,
  ): Promise<void> {
    await firstValueFrom(
      this.http.patch<void>(`${this.apiUrl}/${tournamentId}/matches/${matchNumber}`, payload, {
        headers: this.authHeaders(),
      }),
    );
  }

  async setManualOrder(tournamentId: string, letter: string, teamIds: string[]): Promise<void> {
    await firstValueFrom(
      this.http.patch<void>(`${this.apiUrl}/${tournamentId}/groups/${letter}/order`, { teamIds }, {
        headers: this.authHeaders(),
      }),
    );
  }

  async generateKnockout(tournamentId: string): Promise<Bracket> {
    return firstValueFrom(
      this.http.post<Bracket>(`${this.apiUrl}/${tournamentId}/knockout`, {}, {
        headers: this.authHeaders(),
      }),
    );
  }

  async deleteGroupStage(tournamentId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${tournamentId}`, {
        headers: this.authHeaders(),
      }),
    );
  }
}
