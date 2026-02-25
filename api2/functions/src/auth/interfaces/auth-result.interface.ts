import { PublicUser } from './public-user.interface';

export interface AuthResult extends PublicUser {
  readonly token: string;
}
