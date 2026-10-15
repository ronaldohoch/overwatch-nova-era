import { BracketStatus } from './bracket-status.type';
import { BracketType } from './bracket-type.type';

export interface StoredBracket {
  readonly tournamentId: string;
  readonly type: BracketType;
  /** Tamanho da chave. Com byes, o seedMap tem menos times que isso. */
  readonly teamCount: 4 | 8 | 16 | 32;
  readonly status: BracketStatus;
  /** Posição na chave → teamId. Posição ausente = bye. */
  readonly seedMap: Record<number, string>;
  readonly winnerId: string | null;
  /** 'groups' quando a chave é o mata-mata de uma fase de grupos. */
  readonly source?: 'groups';
  readonly createdAt: string;
  readonly updatedAt: string;
}
