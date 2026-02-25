import { StoredUser } from './stored-user.interface';

export type MutableStoredUser = {
  -readonly [K in keyof StoredUser]: StoredUser[K];
};
