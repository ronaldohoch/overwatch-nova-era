export interface AutomaticAwardContext {
  readonly userUid?: string;
  readonly teamId?: string;
  readonly reason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
