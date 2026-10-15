import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';

type RawRecord = Readonly<Record<string, unknown>>;
type TeamCategory = 'formed' | 'random' | 'unknown';

/** Time disponível para entrar na chave ou nos grupos. */
export interface DrawTeam {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string | null;
}

export interface DrawTeamsResult {
  readonly teams: readonly DrawTeam[];
  /** Mensagem para lista vazia ou erro de carga. */
  readonly message: string | null;
}

/**
 * Times que entram no sorteio de um torneio:
 * - random: times da categoria random ligados ao torneio (coleção global);
 * - closed: times inscritos com check-in confirmado.
 */
@Injectable({ providedIn: 'root' })
export class TournamentTeamsService {
  private readonly http = inject(HttpClient);

  async loadForDraw(tournamentId: string, teamMode: string | null): Promise<DrawTeamsResult> {
    return teamMode === 'random'
      ? this.loadRandomTeams(tournamentId)
      : this.loadClosedTeams(tournamentId);
  }

  private async loadRandomTeams(tournamentId: string): Promise<DrawTeamsResult> {
    try {
      const response = await firstValueFrom(this.http.get<unknown>(environment.apiURLTimes));
      const allTeams = extractArray(response).map((raw) => ({
        id: readId(raw),
        name: readName(raw),
        logoUrl: readLogo(raw),
        category: readTeamCategory(raw),
        tournamentIds: readTeamTournamentIds(raw),
      }));
      const randomTeams = allTeams.filter((team) => team.category === 'random' && !!team.id);
      const unique = [...new Map(randomTeams.map((team) => [team.id, team])).values()];
      const forTournament = unique.filter((team) => team.tournamentIds.includes(tournamentId));
      const scoped = forTournament.length > 0 ? forTournament : unique;

      const teams = sortByName(scoped.map(({ id, name, logoUrl }) => ({ id, name, logoUrl })));
      return {
        teams,
        message: teams.length === 0 ? 'Nenhum time random disponível para seleção.' : null,
      };
    } catch (error: unknown) {
      return { teams: [], message: resolveError(error, 'Não foi possível carregar os times para seleção.') };
    }
  }

  private async loadClosedTeams(tournamentId: string): Promise<DrawTeamsResult> {
    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`${environment.apiURLTorneios}/${tournamentId}/teams`),
      );
      const logos = await this.loadTeamLogos();
      const rows = extractArray(response).filter((raw) => raw['checkedIn'] === true);

      const teams = rows
        .map((raw) => {
          const id = readString(raw, 'teamId') ?? readString(raw, 'id') ?? '';
          return { id, name: readString(raw, 'name') ?? 'Time sem nome', logoUrl: logos[id] ?? null };
        })
        .filter((team) => !!team.id);

      const unique = sortByName([...new Map(teams.map((team) => [team.id, team])).values()]);
      return {
        teams: unique,
        message: unique.length === 0 ? 'Nenhum time com check-in confirmado neste torneio.' : null,
      };
    } catch (error: unknown) {
      return { teams: [], message: resolveError(error, 'Não foi possível carregar os times do torneio.') };
    }
  }

  /** Mapa teamId → logoUrl a partir da coleção global de times. */
  private async loadTeamLogos(): Promise<Record<string, string | null>> {
    try {
      const response = await firstValueFrom(this.http.get<unknown>(environment.apiURLTimes));
      const map: Record<string, string | null> = {};
      for (const raw of extractArray(response)) {
        const id = readId(raw);
        if (id) map[id] = readLogo(raw);
      }
      return map;
    } catch {
      return {};
    }
  }
}

function sortByName<T extends { name: string }>(teams: T[]): T[] {
  return teams.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function readId(raw: RawRecord): string {
  return readString(raw, 'id') ?? readString(raw, '_id') ?? readString(raw, 'teamId') ?? '';
}

function readName(raw: RawRecord): string {
  return readString(raw, 'name') ?? readString(raw, 'teamName') ?? readString(raw, 'title') ?? 'Time sem nome';
}

function readLogo(raw: RawRecord): string | null {
  return readString(raw, 'logoUrl') ?? readString(raw, 'logo_url');
}

function readTeamCategory(value: RawRecord): TeamCategory {
  const raw = (readString(value, 'category') ?? readString(value, 'teamCategory') ?? '').toLowerCase();
  if (raw === 'formed') return 'formed';
  if (raw === 'random') return 'random';
  return 'unknown';
}

function readTeamTournamentIds(value: RawRecord): readonly string[] {
  const tournamentIds = new Set<string>();

  for (const field of ['tournamentId', 'currentTournamentId']) {
    const id = readString(value, field);
    if (id) tournamentIds.add(id);
  }

  for (const field of ['tournamentIds', 'registeredTournamentIds']) {
    const list = value[field];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (typeof item !== 'string') continue;
      const normalized = item.trim();
      if (normalized) tournamentIds.add(normalized);
    }
  }

  const tournaments = value['tournaments'];
  if (Array.isArray(tournaments)) {
    for (const item of tournaments) {
      if (!isRecord(item)) continue;
      const id = readString(item, 'id') ?? readString(item, 'tournamentId');
      if (id) tournamentIds.add(id);
    }
  }

  return [...tournamentIds];
}

function extractArray(value: unknown): RawRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (isRecord(value)) {
    for (const key of ['teams', 'data', 'items', 'results', 'payload']) {
      const nested = value[key];
      if (Array.isArray(nested)) return nested.filter(isRecord);
    }
  }
  return [];
}

function readString(value: RawRecord, field: string): string | null {
  const raw = value[field];
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim();
  return normalized || null;
}

function isRecord(value: unknown): value is RawRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function resolveError(error: unknown, fallbackMessage: string): string {
  if (error instanceof HttpErrorResponse) {
    const message = typeof error.error?.message === 'string' ? error.error.message : null;
    if (message) return message;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallbackMessage;
}
