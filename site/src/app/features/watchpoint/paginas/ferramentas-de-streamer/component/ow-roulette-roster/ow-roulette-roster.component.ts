import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { RouletteEntry } from '../ow-roulette/ow-roulette.component';
import { CardComponent } from '../../../../../../shared/card/card.component';

@Component({
  selector: 'ow-roulette-roster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ow-roulette-roster.component.html',
  imports: [CardComponent],
})
export class OwRouletteRosterComponent {
  readonly items = input<readonly RouletteEntry[]>([]);
  readonly remainingItems = input<readonly RouletteEntry[]>([]);
  readonly selectedItem = input<RouletteEntry | null>(null);
  readonly isRunning = input(false);

  readonly totalCount = computed(() => this.items().length);
  readonly drawnCount = computed(() => this.totalCount() - this.remainingItems().length);
  readonly progressPercent = computed(() => {
    const total = this.totalCount();
    if (!total) return 0;
    return Math.round((this.drawnCount() / total) * 100);
  });

  trackEntry(index: number, entry: RouletteEntry): string {
    return `${entry.id}-${index}`;
  }

  isDrawn(entry: RouletteEntry): boolean {
    return !this.remainingItems().includes(entry);
  }

  isSelected(entry: RouletteEntry): boolean {
    return this.selectedItem() === entry;
  }

  statusLabel(entry: RouletteEntry): string {
    if (this.isSelected(entry)) return 'Atual';
    if (this.isDrawn(entry)) return 'Sorteado';
    return 'Na fila';
  }
}
