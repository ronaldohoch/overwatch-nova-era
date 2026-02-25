import { UserRole } from '../../_enums/role.enum';
import { PublicTrophy } from './public-trophy.interface';

export interface PublicUser {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly battletag: string;
  readonly whatsapp: string;
  readonly role: UserRole;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly trophies: readonly PublicTrophy[];
}
