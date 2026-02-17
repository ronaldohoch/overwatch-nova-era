import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AUTH_API_BASE_URL, AUTH_STORAGE_KEY } from './auth.tokens';

export type AuthUser = Readonly<Record<string, unknown>>;

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

  constructor() {
    this.restoreSession();
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await firstValueFrom(
      this.http.post<LoginApiResponse>(`${this.authApiBaseUrl}/login`, {
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    );

    if (!response.token || typeof response.token !== 'string') {
      throw new Error('Resposta de login invalida.');
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
        password: credentials.password,
      }),
    );

    if (!response.token || typeof response.token !== 'string') {
      throw new Error('Resposta de cadastro invalida.');
    }

    const { token, ...userData } = response;
    const session: AuthSession = {
      token,
      user: userData,
    };

    this.setSession(session);
    return session;
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
}
