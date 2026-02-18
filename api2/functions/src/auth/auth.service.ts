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
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}>;

type AuthResult = PublicUser & Readonly<{ token: string }>;

type StoredUser = Readonly<{
  displayName: string;
  email: string;
  password: string;
  battletag: string;
  battletagLower: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}>;

export class AuthService {
  async signUp(payload: User): Promise<AuthResult> {
    const displayName = payload.displayName?.trim() ?? '';
    const email = (payload.email ?? '').trim().toLowerCase();
    const password = payload.password ?? '';
    const battletag = payload.battletag?.trim() ?? '';
    const whatsapp = payload.battletag?.trim() ?? '';

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

  private validateSignupInput(payload: User): void {
    if (!payload.displayName.trim()) {
      throw new Error('Informe o nome de exibicao.');
    }

    if (!payload.email.trim()) {
      throw new Error('Informe o email.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      throw new Error('Informe um email valido.');
    }

    if (!payload.password) {
      throw new Error('Informe a senha.');
    }

    if (payload.password.length < 8) {
      throw new Error('A senha deve ter ao menos 8 caracteres.');
    }

    if (!payload.battletag.trim()) {
      throw new Error('Informe a BattleTag.');
    }

    if (!/^[A-Za-z0-9_]{3,16}#[0-9]{4,6}$/.test(payload.battletag)) {
      throw new Error('Use o formato Nome#1234.');
    }
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    const snapshot = await firestore
      .collection(USERS_COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      throw new Error('Email ja cadastrado.');
    }
  }

  private async ensureBattletagAvailable(battletag: string): Promise<void> {
    const snapshot = await firestore
      .collection(USERS_COLLECTION)
      .where('battletagLower', '==', battletag.toLowerCase())
      .limit(1)
      .get();

    if (!snapshot.empty) {
      throw new Error('BattleTag ja cadastrada.');
    }
  }

  private toPublicUser(id: string, raw: Partial<StoredUser>): PublicUser {
    return {
      id,
      displayName: raw.displayName ?? '',
      email: raw.email ?? '',
      battletag: raw.battletag ?? '',
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

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export const authSvc = new AuthService();
