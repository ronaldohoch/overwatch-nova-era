import { UserRole } from '../../_enums/role.enum';

export interface StoredUser {
  readonly displayName: string;
  readonly email: string;
  readonly password: string;
  readonly battletag: string;
  readonly battletagLower: string;
  readonly whatsapp: string;
  readonly role: UserRole;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly trophies?: readonly unknown[];
}
