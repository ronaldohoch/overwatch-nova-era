import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  OwSelectOption,
  SelectComponent,
} from '../../../../../shared/design-system/select/select.component';

export interface ChaveManualTeam {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string | null;
}

interface ManualPair {
  readonly matchNumber: number;
  readonly seed1: number;
  readonly seed2: number;
}

/**
 * Montagem manual da chave: cada slot de seed tem um select com os times
 * disponíveis. O time escolhido some das outras opções.
 */
@Component({
  selector: 'app-chave-manual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SelectComponent],
  templateUrl: './chave-manual.component.html',
})
export class ChaveManualComponent {
  readonly teams = input.required<readonly ChaveManualTeam[]>();
  readonly maxTeams = input.required<number>();
  readonly disabled = input(false);

  /** seedNumber (1-based) → teamId */
  readonly seedMapChange = output<Record<number, string>>();

  readonly seedMap = signal<Record<number, string>>({});

  readonly pairs = computed<readonly ManualPair[]>(() => {
    const n = this.maxTeams();
    return Array.from({ length: Math.floor(n / 2) }, (_, i) => ({
      matchNumber: i + 1,
      seed1: i * 2 + 1,
      seed2: i * 2 + 2,
    }));
  });

  readonly filledCount = computed(() => Object.keys(this.seedMap()).length);
  readonly complete = computed(() => this.filledCount() === this.maxTeams());

  /** Times ainda não alocados em nenhum slot. */
  readonly availableTeams = computed<readonly ChaveManualTeam[]>(() => {
    const used = new Set(Object.values(this.seedMap()));
    return this.teams().filter((team) => !used.has(team.id));
  });

  /**
   * Opções por slot: os times livres mais o já escolhido nele.
   * Memoizado para manter a mesma referência entre ciclos de detecção.
   */
  readonly optionsBySeed = computed<Record<number, OwSelectOption[]>>(() => {
    const map = this.seedMap();
    const free = this.availableTeams().map((team) => ({ value: team.id, label: team.name }));
    const byId = new Map(this.teams().map((team) => [team.id, team]));
    const result: Record<number, OwSelectOption[]> = {};

    for (let seed = 1; seed <= this.maxTeams(); seed++) {
      const current = map[seed] ? byId.get(map[seed]) : undefined;
      const options = current
        ? [{ value: current.id, label: current.name }, ...free]
        : [...free];

      result[seed] = options.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    }

    return result;
  });

  valueFor(seed: number): string {
    return this.seedMap()[seed] ?? '';
  }

  teamAtSeed(seed: number): ChaveManualTeam | null {
    const teamId = this.seedMap()[seed];
    if (!teamId) return null;
    return this.teams().find((t) => t.id === teamId) ?? null;
  }

  onSeedChange(seed: number, teamId: string): void {
    const normalized = teamId.trim();

    this.seedMap.update((map) => {
      const next = { ...map };

      if (!normalized) {
        delete next[seed];
        return next;
      }

      // Um time só pode ocupar um slot: limpa onde ele estiver.
      for (const [key, value] of Object.entries(next)) {
        if (value === normalized) delete next[Number(key)];
      }

      next[seed] = normalized;
      return next;
    });

    this.emit();
  }

  clearSeed(seed: number): void {
    this.seedMap.update((map) => {
      const next = { ...map };
      delete next[seed];
      return next;
    });
    this.emit();
  }

  clearAll(): void {
    this.seedMap.set({});
    this.emit();
  }

  initials(name: string): string {
    return name.trim().substring(0, 2).toUpperCase();
  }

  private emit(): void {
    this.seedMapChange.emit({ ...this.seedMap() });
  }
}
