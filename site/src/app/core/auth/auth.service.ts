import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AUTH_API_BASE_URL, AUTH_STORAGE_KEY } from './auth.tokens';
import { isUserRole, type UserRole } from './user-role';

export type AuthUser = Readonly<{
  role?: string;
}> &
  Readonly<Record<string, unknown>>;

export type AuthSession = Readonly<{
  token: string;
  user: AuthUser;
}>;

export type LoginCredentials = Readonly<{
  email: string;
  password: string;
}>;

export type CreateData = Readonly<{
  displayName: string;
  email: string;
  password: string;
  battletag: string;
  whatsapp: string;
}>;

export type UpdateCurrentUserData = Readonly<{
  displayName: string;
  email: string;
  whatsapp: string;
}>;

export type ChangeCurrentUserPasswordData = Readonly<{
  currentPassword: string;
  newPassword: string;
}>;

type LoginApiResponse = Readonly<Record<string, unknown>> & {
  token: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authApiBaseUrl = inject(AUTH_API_BASE_URL);
  private readonly browser = isPlatformBrowser(this.platformId);

  private readonly sessionState = signal<AuthSession | null>(null);

  readonly session = computed(() => this.sessionState());
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly token = computed(() => this.sessionState()?.token ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionState()?.token);
  readonly userRole = computed<UserRole | null>(() => {
    const role = this.user()?.role;
    return isUserRole(role) ? role : null;
  });
  readonly displayName = computed(() => {
    const user = this.user();
    if (!user) return null;

    const value = user['displayName'];
    return typeof value === 'string' && value.trim() ? value : null;
  });

  constructor() {
    this.restoreSession();
    this.syncSessionAcrossTabs();
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await firstValueFrom(
      this.http.post<LoginApiResponse>(`${this.authApiBaseUrl}/login`, {
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    );

    if (!response.token || typeof response.token !== 'string') {
      throw new Error('Resposta de login inválida.');
    }

    const { token, ...userData } = response;
    const session: AuthSession = {
      token,
      user: userData,
    };

    this.setSession(session);
    return session;
  }

  async create(credentials: CreateData): Promise<AuthSession> {
    const response = await firstValueFrom(
      this.http.post<LoginApiResponse>(`${this.authApiBaseUrl}/signup`, {
        displayName: credentials.displayName.trim(),
        email: credentials.email.trim(),
        battletag: credentials.battletag.trim(),
        whatsapp: credentials.whatsapp.trim(),
        password: credentials.password,
      }),
    );

    if (!response.token || typeof response.token !== 'string') {
      throw new Error('Resposta de cadastro inválida.');
    }

    const { token, ...userData } = response;
    const session: AuthSession = {
      token,
      user: userData,
    };

    this.setSession(session);
    return session;
  }

  async updateCurrentUser(data: UpdateCurrentUserData): Promise<AuthSession> {
    if (!this.token()) {
      throw new Error('Sessão inválida. Faça login novamente.');
    }

    const response = await firstValueFrom(
      this.http.put<LoginApiResponse>(`${this.authApiBaseUrl}/me`, {
        displayName: data.displayName.trim(),
        email: data.email.trim(),
        whatsapp: data.whatsapp.trim(),
      }),
    );

    if (!response.token || typeof response.token !== 'string') {
      throw new Error('Resposta de atualização inválida.');
    }

    const { token, ...userData } = response;
    const session: AuthSession = {
      token,
      user: userData,
    };

    this.setSession(session);
    return session;
  }

  async changeCurrentUserPassword(data: ChangeCurrentUserPasswordData): Promise<void> {
    if (!this.token()) {
      throw new Error('Sessão inválida. Faça login novamente.');
    }

    await firstValueFrom(
      this.http.put(`${this.authApiBaseUrl}/me/password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    );
  }

  async forgotPassword(email: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.authApiBaseUrl}/forgot-password`, { email }),
    );
  }

  logout(): void {
    this.sessionState.set(null);
    this.removePersistedSession();
  }

  restoreSession(): void {
    this.sessionState.set(this.readPersistedSession());
  }

  private setSession(session: AuthSession): void {
    this.sessionState.set(session);
    this.persistSession(session);
  }

  private persistSession(session: AuthSession): void {
    if (!this.browser) return;

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // no-op: storage may be blocked by browser settings
    }
  }

  private readPersistedSession(): AuthSession | null {
    if (!this.browser) return null;

    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<AuthSession> | null;
      if (!parsed || typeof parsed !== 'object') return null;
      if (typeof parsed.token !== 'string' || !parsed.user || typeof parsed.user !== 'object') {
        return null;
      }
      if (this.isExpiredToken(parsed.token)) {
        this.removePersistedSession();
        return null;
      }

      return {
        token: parsed.token,
        user: parsed.user as AuthUser,
      };
    } catch {
      this.removePersistedSession();
      return null;
    }
  }

  private removePersistedSession(): void {
    if (!this.browser) return;

    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // no-op: storage may be blocked by browser settings
    }
  }

  private syncSessionAcrossTabs(): void {
    if (!this.browser) return;

    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key !== AUTH_STORAGE_KEY) return;

      this.restoreSession();
    });
  }

  private isExpiredToken(token: string): boolean {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return false;

    try {
      const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const normalizedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const payloadJson = atob(normalizedBase64);
      const payload = JSON.parse(payloadJson) as Record<string, unknown>;
      const exp = payload['exp'];

      if (typeof exp !== 'number' || !Number.isFinite(exp)) {
        return false;
      }

      return Date.now() >= exp * 1000;
    } catch {
      return false;
    }
  }
}
