import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../_config/env';
import { User } from '../_interfaces/users.interface';
import { firestore } from '../firebase';
import { UserRole } from '../_enums/role.enum';

const USERS_COLLECTION = 'users';
const BCRYPT_SALT_ROUNDS = 10;
const DEFAULT_ROLE = UserRole.COMPETIDOR;

type PublicUser = Readonly<{
  id: string;
  displayName: string;
  email: string;
  battletag: string;
  whatsapp: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}>;

type AuthResult = PublicUser & Readonly<{ token: string }>;

type UpdateUserPayload = Readonly<{
  displayName: string;
  email: string;
  whatsapp: string;
}>;

type NormalizedUpdateUserPayload = Readonly<{
  displayName: string;
  email: string;
  whatsapp: string;
}>;

type ChangePasswordPayload = Readonly<{
  currentPassword: string;
  newPassword: string;
}>;

type StoredUser = Readonly<{
  displayName: string;
  email: string;
  password: string;
  battletag: string;
  battletagLower: string;
  whatsapp: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}>;

type MutableStoredUser = {
  -readonly [K in keyof StoredUser]: StoredUser[K];
};

export class AuthService {
  async signUp(payload: User): Promise<AuthResult> {
    const displayName = payload.displayName?.trim() ?? '';
    const email = (payload.email ?? '').trim().toLowerCase();
    const password = payload.password ?? '';
    const battletag = payload.battletag?.trim() ?? '';
    const whatsapp = payload.whatsapp?.trim() ?? '';

    this.validateSignupInput({ displayName, email, password, battletag, whatsapp });

    await this.ensureEmailAvailable(email);
    await this.ensureBattletagAvailable(battletag);

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const now = new Date().toISOString();

    const userToStore: StoredUser = {
      displayName,
      email,
      password: passwordHash,
      battletag,
      battletagLower: battletag.toLowerCase(),
      whatsapp,
      role: DEFAULT_ROLE,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await firestore.collection(USERS_COLLECTION).add(userToStore);
    const createdUser = this.toPublicUser(ref.id, userToStore);

    return { ...createdUser, token: this.createToken(createdUser) };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    const normalizedPassword = password ?? '';

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('Informe email e senha.');
    }

    const snapshot = await firestore
      .collection(USERS_COLLECTION)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error('Credenciais invalidas.');
    }

    const doc = snapshot.docs[0];
    const user = doc.data() as Partial<StoredUser>;
    const userPassword = typeof user.password === 'string' ? user.password : '';

    if (!userPassword) {
      throw new Error('Credenciais invalidas.');
    }

    const passwordMatches = await bcrypt.compare(normalizedPassword, userPassword);
    if (!passwordMatches) {
      throw new Error('Credenciais invalidas.');
    }

    const publicUser = this.toPublicUser(doc.id, user);
    return { ...publicUser, token: this.createToken(publicUser) };
  }

  async changePassword(userId: string, payload: ChangePasswordPayload): Promise<void> {
    const currentPassword = payload.currentPassword ?? '';
    const newPassword = payload.newPassword ?? '';

    if (!currentPassword) {
      throw new Error('Informe sua senha atual.');
    }

    if (!newPassword) {
      throw new Error('Informe a nova senha.');
    }

    if (newPassword.length < 8) {
      throw new Error('A nova senha deve ter ao menos 8 caracteres.');
    }

    const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      throw new Error('Usuario nao encontrado.');
    }

    const currentUser = userSnapshot.data() as Partial<StoredUser>;
    const storedPassword = typeof currentUser.password === 'string' ? currentUser.password : '';

    if (!storedPassword) {
      throw new Error('Credenciais invalidas.');
    }

    const passwordMatches = await bcrypt.compare(currentPassword, storedPassword);
    if (!passwordMatches) {
      throw new Error('Senha atual incorreta.');
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await userRef.update({
      password: passwordHash,
      updatedAt: now,
    });
  }

  async updateMe(userId: string, payload: UpdateUserPayload): Promise<AuthResult> {
    const normalized = this.normalizeUpdatePayload(payload);
    this.validateUpdateInput(normalized);

    const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      throw new Error('Usuario nao encontrado.');
    }

    const currentUser = userSnapshot.data() as Partial<StoredUser>;
    const currentEmail = (currentUser.email ?? '').trim().toLowerCase();

    if (normalized.email !== currentEmail) {
      await this.ensureEmailAvailable(normalized.email, userId);
    }

    const now = new Date().toISOString();
    const updates: Partial<MutableStoredUser> = {
      displayName: normalized.displayName,
      email: normalized.email,
      whatsapp: normalized.whatsapp,
      updatedAt: now,
    };

    await userRef.update(updates);

    const publicUser = this.toPublicUser(userId, {
      ...currentUser,
      ...updates,
    });

    return { ...publicUser, token: this.createToken(publicUser) };
  }

  private validateSignupInput(payload: User): void {
    this.validateCommonUserFields({
      displayName: payload.displayName,
      email: payload.email,
      whatsapp: payload.whatsapp,
    });

    if (!payload.battletag.trim()) {
      throw new Error('Informe a BattleTag.');
    }

    if (!/^[A-Za-z0-9_]{3,16}#[0-9]{4,6}$/.test(payload.battletag)) {
      throw new Error('Use o formato Nome#1234.');
    }

    if (!payload.password) {
      throw new Error('Informe a senha.');
    }

    if (payload.password.length < 8) {
      throw new Error('A senha deve ter ao menos 8 caracteres.');
    }
  }

  private validateUpdateInput(payload: NormalizedUpdateUserPayload): void {
    this.validateCommonUserFields(payload);
  }

  private validateCommonUserFields(payload: {
    displayName: string;
    email: string;
    whatsapp: string;
  }): void {
    if (!payload.displayName.trim()) {
      throw new Error('Informe o nome de exibicao.');
    }

    if (!payload.email.trim()) {
      throw new Error('Informe o email.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      throw new Error('Informe um email valido.');
    }

    if (!payload.whatsapp.trim()) {
      throw new Error('Informe seu whatsapp.');
    }
  }

  private normalizeUpdatePayload(payload: UpdateUserPayload): NormalizedUpdateUserPayload {
    return {
      displayName: payload.displayName?.trim() ?? '',
      email: (payload.email ?? '').trim().toLowerCase(),
      whatsapp: payload.whatsapp?.trim() ?? '',
    };
  }

  private async ensureEmailAvailable(email: string, ignoredUserId?: string): Promise<void> {
    const snapshot = await firestore
      .collection(USERS_COLLECTION)
      .where('email', '==', email)
      .limit(5)
      .get();

    const hasConflict = snapshot.docs.some((doc) => doc.id !== ignoredUserId);
    if (hasConflict) {
      throw new Error('Email ja cadastrado.');
    }
  }

  private async ensureBattletagAvailable(battletag: string, ignoredUserId?: string): Promise<void> {
    const snapshot = await firestore
      .collection(USERS_COLLECTION)
      .where('battletagLower', '==', battletag.toLowerCase())
      .limit(5)
      .get();

    const hasConflict = snapshot.docs.some((doc) => doc.id !== ignoredUserId);
    if (hasConflict) {
      throw new Error('BattleTag ja cadastrada.');
    }
  }

  private toPublicUser(id: string, raw: Partial<StoredUser>): PublicUser {
    return {
      id,
      displayName: raw.displayName ?? '',
      email: raw.email ?? '',
      battletag: raw.battletag ?? '',
      whatsapp: raw.whatsapp ?? '',
      role: this.readStoredRole(raw.role),
      createdAt: raw.createdAt ?? '',
      updatedAt: raw.updatedAt ?? '',
    };
  }

  private readStoredRole(role: unknown): UserRole {
    if (role === UserRole.ADMIN || role === UserRole.STREAMER || role === UserRole.COMPETIDOR) {
      return role;
    }

    return DEFAULT_ROLE;
  }

  private createToken(user: PublicUser): string {
    const payload = {
      sub: user.id,
      displayName: user.displayName,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }
}

export function verifyToken(token: string): string | jwt.JwtPayload {
  return jwt.verify(token, JWT_SECRET);
}

export const authSvc = new AuthService();
