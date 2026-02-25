import { ActorRole } from './actor-role.type';
import { InviteStatus } from './invite-status.type';

export interface StoredInvite {
  readonly uid: string;
  readonly status: InviteStatus;
  readonly invitedByUid: string;
  readonly invitedByRole: ActorRole;
  readonly invitedAt: string;
  readonly updatedAt: string;
}
