export interface CreateGroupStageDto {
  /**
   * Grupos já montados (sorteio ao vivo ou montagem manual no front).
   * Sem isso, sorteia entre os times com check-in.
   */
  readonly groups?: unknown;
}
