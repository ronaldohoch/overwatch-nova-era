import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { StatsCardComponent } from './components/stats-card/stats-card.component';

type RoleCardModel = Readonly<{
  id: 'tank' | 'dps' | 'support';
  title: string;
  value: string | number;
  subtitle: string;
  progress: number;
}>;

type ApiRoleItem = Readonly<{
  total?: unknown;
  checkedIn?: unknown;
  available?: unknown;
}>;

type ApiResponse = Readonly<{
  roles?: Readonly<{
    tank?: ApiRoleItem;
    dps?: ApiRoleItem;
    support?: ApiRoleItem;
  }>;
}>;

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, StatsCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly torneiosApiUrl = `${environment.apiURLTorneios}`;
  readonly loadingRoleCards = signal(true);

  readonly roleCards = signal<readonly RoleCardModel[]>([
    this.emptyCard('tank', 'Tanque'),
    this.emptyCard('dps', 'Dano'),
    this.emptyCard('support', 'Suporte'),
  ]);

  constructor() {
    void this.loadRoleCards();
  }

  private async loadRoleCards(): Promise<void> {
    this.loadingRoleCards.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse>(
          `${this.torneiosApiUrl}/${environment.TOURNAMENT_ID}/checkins/availability-by-role`,
        ),
      );

      const roles = response?.roles ?? {};
      this.roleCards.set([
        this.toCard('tank', 'Tanque', roles.tank),
        this.toCard('dps', 'Dano', roles.dps),
        this.toCard('support', 'Suporte', roles.support),
      ]);
    } catch {
      // Mantem os cards no estado padrao se a API falhar.
    } finally {
      this.loadingRoleCards.set(false);
    }
  }

  private emptyCard(id: RoleCardModel['id'], title: string): RoleCardModel {
    return {
      id,
      title,
      value: '--',
      subtitle: 'Sem dados',
      progress: 0,
    };
  }

  private toCard(id: RoleCardModel['id'], title: string, data: ApiRoleItem | undefined): RoleCardModel {
    const total = this.toSafeInt(data?.total);
    const checkedIn = this.toSafeInt(data?.checkedIn);
    const available = this.toSafeInt(data?.available);
    const progress = total > 0 ? (checkedIn / total) * 100 : 0;

    return {
      id,
      title,
      value: available,
      subtitle: `${checkedIn} de ${total} ocupadas`,
      progress,
    };
  }

  private toSafeInt(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
  }
}
