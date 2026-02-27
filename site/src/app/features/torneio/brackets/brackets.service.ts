import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';

export type BracketSide = 'winners' | 'losers' | 'grand-final';
export type MatchStatus = 'pending' | 'ready' | 'running' | 'finished';
export type BracketStatus = 'running' | 'finished';

export interface MatchSlot {
  readonly type: 'seed' | 'winner_of' | 'loser_of';
  readonly ref: number;
}

export interface BracketMatch {
  readonly id: string;
  readonly matchNumber: number;
  readonly round: number;
  readonly side: BracketSide;
  readonly slot1: MatchSlot;
  readonly slot2: MatchSlot;
  readonly team1Id: string | null;
  readonly team2Id: string | null;
  readonly team1Score: number | null;
  readonly team2Score: number | null;
  readonly winnerId: string | null;
  readonly loserId: string | null;
  readonly status: MatchStatus;
}

export interface Bracket {
  readonly id: string;
  readonly tournamentId: string;
  readonly type: 'double-elimination';
  readonly teamCount: 4 | 8 | 16 | 32;
  readonly status: BracketStatus;
  readonly seedMap: Record<number, string>;
  readonly winnerId: string | null;
  readonly matches: BracketMatch[];
}

export interface CreateBracketPayload {
  readonly seedMode: 'manual' | 'random';
  readonly teamIds?: string[];
}

export interface ReportMatchPayload {
  readonly winnerId: string;
  readonly team1Score?: number;
  readonly team2Score?: number;
}

export interface ReportMatchResult {
  readonly matchNumber: number;
  readonly winnerId: string;
  readonly loserId: string;
  readonly bracketFinished: boolean;
  readonly bracketWinnerId: string | null;
}

@Injectable({ providedIn: 'root' })
export class BracketsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly apiUrl = environment.apiURLBrackets;

  private authHeaders(): HttpHeaders {
    const token = this.auth.token();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  async createBracket(tournamentId: string, payload: CreateBracketPayload): Promise<Bracket> {
    return firstValueFrom(
      this.http.post<Bracket>(`${this.apiUrl}/${tournamentId}`, payload, {
        headers: this.authHeaders(),
      }),
    );
  }

  async getBracket(tournamentId: string): Promise<Bracket> {
    return firstValueFrom(
      this.http.get<Bracket>(`${this.apiUrl}/${tournamentId}`, {
        headers: this.authHeaders(),
      }),
    );
  }

  async reportMatchResult(
    tournamentId: string,
    matchNumber: number,
    payload: ReportMatchPayload,
  ): Promise<ReportMatchResult> {
    return firstValueFrom(
      this.http.patch<ReportMatchResult>(
        `${this.apiUrl}/${tournamentId}/matches/${matchNumber}`,
        payload,
        { headers: this.authHeaders() },
      ),
    );
  }

  async deleteBracket(tournamentId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${tournamentId}`, {
        headers: this.authHeaders(),
      }),
    );
  }
}
