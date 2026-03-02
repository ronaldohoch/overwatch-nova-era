import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../../../../environments/environment';
import {
  RadioGroupComponent,
  RadioItemComponent,
} from '../../../../../../../shared/design-system/radio/radio.component';
import type { SetupResult, TeamOption } from '../interfaces';

@Component({
  selector: 'app-setup-banimento',
  imports: [FormsModule, RadioGroupComponent, RadioItemComponent],
  templateUrl: './setup-banimento.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupBanimentoComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly confirmed = output<SetupResult>();

  readonly team1Query = signal('');
  readonly team1Selected = signal<TeamOption | null>(null);
  readonly team1Results = signal<TeamOption[]>([]);
  readonly team1Open = signal(false);

  readonly team2Query = signal('');
  readonly team2Selected = signal<TeamOption | null>(null);
  readonly team2Results = signal<TeamOption[]>([]);
  readonly team2Open = signal(false);

  // String value for ngModel binding with ow-radio-group
  readonly banCountStr = signal('3');

  readonly banCountSlots = computed(() =>
    Array.from({ length: parseInt(this.banCountStr(), 10) }, (_, i) => i),
  );

  readonly canStart = computed(
    () => !!this.team1Selected() && !!this.team2Selected(),
  );

  private allTeams: TeamOption[] = [];
  private search1Timer: ReturnType<typeof setTimeout> | null = null;
  private search2Timer: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<unknown>(environment.apiURLTimes),
      );
      this.allTeams = this.extractTeams(res);
    } catch {
      this.allTeams = [];
    }
  }

  onTeam1Input(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.team1Query.set(query);
    this.team1Selected.set(null);
    this.team1Open.set(true);
    if (this.search1Timer) clearTimeout(this.search1Timer);
    this.search1Timer = setTimeout(() => this.filterTeams(1, query), 250);
  }

  onTeam2Input(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.team2Query.set(query);
    this.team2Selected.set(null);
    this.team2Open.set(true);
    if (this.search2Timer) clearTimeout(this.search2Timer);
    this.search2Timer = setTimeout(() => this.filterTeams(2, query), 250);
  }

  onTeam1Focus(): void {
    this.team1Open.set(true);
    this.filterTeams(1, this.team1Query());
  }

  onTeam2Focus(): void {
    this.team2Open.set(true);
    this.filterTeams(2, this.team2Query());
  }

  closeTeam1(): void {
    setTimeout(() => this.team1Open.set(false), 150);
  }

  closeTeam2(): void {
    setTimeout(() => this.team2Open.set(false), 150);
  }

  selectTeam1(team: TeamOption): void {
    this.team1Selected.set(team);
    this.team1Query.set(team.name);
    this.team1Open.set(false);
  }

  selectTeam2(team: TeamOption): void {
    this.team2Selected.set(team);
    this.team2Query.set(team.name);
    this.team2Open.set(false);
  }

  clearTeam1(): void {
    this.team1Selected.set(null);
    this.team1Query.set('');
    this.team1Results.set([]);
  }

  clearTeam2(): void {
    this.team2Selected.set(null);
    this.team2Query.set('');
    this.team2Results.set([]);
  }

  onBanCountChange(value: string): void {
    this.banCountStr.set(value);
  }

  close(): void {
    this.router.navigate(['/watchpoint/ferramentas-de-streamer']);
  }

  start(): void {
    const t1 = this.team1Selected();
    const t2 = this.team2Selected();
    if (!t1 || !t2) return;
    this.confirmed.emit({
      team1: t1,
      team2: t2,
      banCount: parseInt(this.banCountStr(), 10) as 1 | 2 | 3,
    });
  }

  private filterTeams(team: 1 | 2, query: string): void {
    const q = query.toLowerCase().trim();
    const results = (
      q ? this.allTeams.filter((t) => t.name.toLowerCase().includes(q)) : this.allTeams
    ).slice(0, 8);
    if (team === 1) this.team1Results.set(results);
    else this.team2Results.set(results);
  }

  private extractTeams(res: unknown): TeamOption[] {
    const keys = ['teams', 'data', 'items', 'results', 'payload'];
    for (const key of keys) {
      const arr = (res as Record<string, unknown>)?.[key];
      if (Array.isArray(arr)) return this.mapItems(arr);
    }
    if (Array.isArray(res)) return this.mapItems(res as unknown[]);
    return [];
  }

  private mapItems(items: unknown[]): TeamOption[] {
    return items
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((x) => ({
        id: String(x['id'] ?? ''),
        name: String(x['name'] ?? ''),
        logoUrl: typeof x['logoUrl'] === 'string' ? x['logoUrl'] : undefined,
      }))
      .filter((t) => t.id && t.name);
  }
}
