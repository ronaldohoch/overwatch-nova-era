export type SeedMode = 'manual' | 'random';

export interface CreateBracketDto {
  readonly seedMode?: unknown;
  readonly teamIds?: unknown;
}
