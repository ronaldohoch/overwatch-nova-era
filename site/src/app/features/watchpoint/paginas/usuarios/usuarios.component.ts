import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AUTH_API_BASE_URL } from '../../../../core/auth/auth.tokens';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { ListItemComponent, type OwScheduleStatus } from '../../../../shared/list-item/list-item.component';

type RawRecord = Readonly<Record<string, unknown>>;

type UserListItem = Readonly<{
  id: string;
  displayName: string;
  email: string;
  battletag: string;
  whatsapp: string;
  roleLabel: string;
  status: OwScheduleStatus;
  createdAtLabel: string;
}>;

type RoleInfo = Readonly<{
  label: string;
  status: OwScheduleStatus;
}>;

@Component({
  selector: 'app-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListItemComponent, ButtonsComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
})
export class UsuariosComponent {
  private readonly http = inject(HttpClient);
  private readonly authApiBaseUrl = inject(AUTH_API_BASE_URL);
  private readonly usersApiUrl = `${this.authApiBaseUrl.replace(/\/$/, '')}/users`;
  private readonly dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  readonly users = signal<readonly UserListItem[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly userCountLabel = computed(() => `${this.users().length} usuarios cadastrados`);

  constructor() {
    void this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const response = await firstValueFrom(this.http.get<unknown>(this.usersApiUrl));
      const users = this.readUsers(response).map((item, index) => this.toListItem(item, index));
      this.users.set(users);
    } catch (error: unknown) {
      this.users.set([]);
      this.errorMessage.set(this.resolveError(error, 'Nao foi possivel carregar os usuarios.'));
    } finally {
      this.loading.set(false);
    }
  }

  private readUsers(value: unknown): readonly RawRecord[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is RawRecord => this.isRecord(item));
    }

    if (!this.isRecord(value)) return [];

    for (const key of ['users', 'data', 'items', 'results']) {
      const maybeArray = value[key];
      if (!Array.isArray(maybeArray)) continue;

      return maybeArray.filter((item): item is RawRecord => this.isRecord(item));
    }

    return [];
  }

  private toListItem(value: RawRecord, index: number): UserListItem {
    const roleInfo = this.readRole(value['role']);
    const id =
      this.readString(value, 'id') ??
      this.readString(value, 'uid') ??
      this.readString(value, '_id') ??
      `user-${index + 1}`;

    return {
      id,
      displayName:
        this.readString(value, 'displayName') ?? this.readString(value, 'name') ?? 'Sem nome',
      email: this.readString(value, 'email') ?? 'Sem e-mail',
      battletag: this.readString(value, 'battletag') ?? 'Sem BattleTag',
      whatsapp: this.readString(value, 'whatsapp') ?? 'Sem WhatsApp',
      roleLabel: roleInfo.label,
      status: roleInfo.status,
      createdAtLabel: this.toCreatedAtLabel(
        this.readString(value, 'createdAt') ?? this.readString(value, 'created_at'),
      ),
    };
  }

  private readRole(value: unknown): RoleInfo {
    if (typeof value !== 'string') {
      return { label: 'Membro', status: 'finished' };
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'admin') return { label: 'Admin', status: 'live' };
    if (normalized === 'streamer') return { label: 'Streamer', status: 'upcoming' };
    if (normalized === 'competidor') return { label: 'Competidor', status: 'finished' };

    return { label: 'Membro', status: 'finished' };
  }

  private toCreatedAtLabel(value: string | null): string {
    if (!value) return 'Cadastro: nao informado';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return `Cadastro: ${value}`;
    }

    return `Cadastro: ${this.dateFormatter.format(parsed)}`;
  }

  private readString(value: RawRecord, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
  }

  private isRecord(value: unknown): value is RawRecord {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private resolveError(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage =
        typeof error.error?.message === 'string'
          ? error.error.message
          : typeof error.error?.error === 'string'
            ? error.error.error
            : null;

      if (backendMessage) return backendMessage;
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }
}
