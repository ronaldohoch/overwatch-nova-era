import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { ButtonsComponent } from '../../../../shared/buttons/buttons';
// import { StatsCardComponent } from './components/stats-card/stats-card.component';
// import { ButtonsComponent } from "../../../../shared/buttons/buttons";
import { ProximasPartidasComponent } from "../../../pagina-inicial/components/proximas-partidas/proximas-partidas.component";

type RoleCardModel = Readonly<{
  id: 'tank' | 'dps' | 'support';
  title: string;
  value: string | number;
  subtitle: string;
  progress: number;
}>;

type RepescagemCardModel = Readonly<{
  role: string;
  slots: number;
  checkedIn: number;
  available: number;
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
  imports: [/*StatsCardComponent, ButtonsComponent,*/ ProximasPartidasComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly torneiosApiUrl = `${environment.apiURLTorneios}`;
  readonly loadingRoleCards = signal(true);
  readonly loadingRepescagemCard = signal(true);

  readonly roleCards = signal<readonly RoleCardModel[]>([
    this.emptyCard('tank', 'Tanque'),
    this.emptyCard('dps', 'Dano'),
    this.emptyCard('support', 'Suporte'),
  ]);

  readonly repescagemCard = signal<RepescagemCardModel | null>(null);

  constructor() {
    void this.loadRoleCards();
    void this.loadRepescagemCard();
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

  private async loadRepescagemCard(): Promise<void> {
    this.loadingRepescagemCard.set(true);

    try {
      const response = await firstValueFrom(
        this.http.get<Record<string, unknown>>(
          `${this.torneiosApiUrl}/${environment.TOURNAMENT_ID}`,
        ),
      );

      const repescagem = response?.['repescagem'];
      if (!repescagem || typeof repescagem !== 'object') {
        this.repescagemCard.set(null);
        return;
      }

      const ROLE_LABELS: Record<string, string> = {
        flex: 'Flex',
        tank: 'Tanque',
        dps: 'Dano',
        support: 'Suporte',
      };

      const r = repescagem as Record<string, unknown>;
      const slots = this.toSafeInt(r['slots']);
      const checkedIn = this.toSafeInt(r['checkedIn']);
      const available = Math.max(slots - checkedIn, 0);
      const progress = slots > 0 ? (checkedIn / slots) * 100 : 0;
      const roleKey = typeof r['role'] === 'string' ? r['role'] : '';
      const role = ROLE_LABELS[roleKey] ?? roleKey;

      this.repescagemCard.set({ role, slots, checkedIn, available, progress });
    } catch {
      this.repescagemCard.set(null);
    } finally {
      this.loadingRepescagemCard.set(false);
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
