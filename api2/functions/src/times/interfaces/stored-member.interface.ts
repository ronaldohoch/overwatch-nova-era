import { ActorRole } from './actor-role.type';
import { MemberSource } from './member-source.type';

export interface StoredMember {
  readonly uid: string;
  readonly joinedAt: string;
  readonly addedByUid: string;
  readonly addedByRole: ActorRole;
  readonly source: MemberSource;
}
