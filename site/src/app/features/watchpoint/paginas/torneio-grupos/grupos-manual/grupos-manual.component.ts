import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  OwSelectOption,
  SelectComponent,
} from '../../../../../shared/design-system/select/select.component';
import { groupLetter, groupSizes } from '../../../../torneio/grupos/grupos.service';
import { DrawTeam } from '../../torneio-bracket/tournament-teams.service';

interface ManualGroup {
  readonly letter: string;
  /** Posições globais (1-based) das vagas deste grupo. */
  readonly slots: readonly number[];
}

/**
 * Montagem manual dos grupos: cada vaga tem um select com os times livres.
 * O tamanho de cada grupo segue a divisão automática (4, completando com 3).
 */
@Component({
  selector: 'app-grupos-manual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SelectComponent],
  templateUrl: './grupos-manual.component.html',
})
export class GruposManualComponent {
  readonly teams = input.required<readonly DrawTeam[]>();
  readonly disabled = input(false);

  /** Grupos completos, ou null enquanto falta preencher vaga. */
  readonly groupsChange = output<string[][] | null>();

  /** vaga (1-based) → teamId */
  readonly slotMap = signal<Record<number, string>>({});

  readonly groups = computed<readonly ManualGroup[]>(() => {
    let next = 1;
    return groupSizes(this.teams().length).map((size, g) => ({
      letter: groupLetter(g),
      slots: Array.from({ length: size }, () => next++),
    }));
  });

  readonly totalSlots = computed(() => this.groups().reduce((sum, g) => sum + g.slots.length, 0));
  readonly filledCount = computed(() => Object.keys(this.slotMap()).length);

  readonly availableTeams = computed<readonly DrawTeam[]>(() => {
    const used = new Set(Object.values(this.slotMap()));
    return this.teams().filter((team) => !used.has(team.id));
  });

  readonly optionsBySlot = computed<Record<number, OwSelectOption[]>>(() => {
    const map = this.slotMap();
    const free = this.availableTeams().map((team) => ({ value: team.id, label: team.name }));
    const byId = new Map(this.teams().map((team) => [team.id, team]));
    const result: Record<number, OwSelectOption[]> = {};

    for (let slot = 1; slot <= this.totalSlots(); slot++) {
      const current = map[slot] ? byId.get(map[slot]) : undefined;
      const options = current ? [{ value: current.id, label: current.name }, ...free] : [...free];
      result[slot] = options.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    }
    return result;
  });

  valueFor(slot: number): string {
    return this.slotMap()[slot] ?? '';
  }

  onSlotChange(slot: number, teamId: string): void {
    const normalized = teamId.trim();
    this.slotMap.update((map) => {
      const next = { ...map };
      if (!normalized) {
        delete next[slot];
        return next;
      }
      // Um time ocupa uma vaga só: sai de onde estava.
      for (const [key, value] of Object.entries(next)) {
        if (value === normalized) delete next[Number(key)];
      }
      next[slot] = normalized;
      return next;
    });
    this.emit();
  }

  clearAll(): void {
    this.slotMap.set({});
    this.emit();
  }

  private emit(): void {
    if (this.filledCount() !== this.totalSlots()) {
      this.groupsChange.emit(null);
      return;
    }
    const map = this.slotMap();
    this.groupsChange.emit(this.groups().map((g) => g.slots.map((slot) => map[slot])));
  }
}
