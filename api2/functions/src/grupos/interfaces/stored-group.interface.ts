export interface StoredGroup {
  /** A, B, C... (também é o id do documento) */
  readonly letter: string;
  readonly teamIds: string[];
  /** Ordem definida pelo admin para empates que nenhum critério resolveu. */
  readonly manualOrder: string[] | null;
}
