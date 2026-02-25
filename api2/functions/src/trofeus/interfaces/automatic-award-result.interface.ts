import { AwardResult } from './award-result.interface';

export interface AutomaticAwardResult {
  readonly eventCode: string;
  readonly awards: readonly AwardResult[];
}
