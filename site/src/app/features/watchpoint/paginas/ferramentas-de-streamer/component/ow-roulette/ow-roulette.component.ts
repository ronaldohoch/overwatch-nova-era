import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ButtonsComponent } from '../../../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../../../shared/card/card.component';
import { ModalService } from '../../../../../../shared/modal/modal.service';
import { OwRouletteRosterComponent } from '../ow-roulette-roster/ow-roulette-roster.component';
import { OwRouletteSelectedComponent } from '../ow-roulette-selected/list-item.component';
import { OwRouletteAddToTeamModalComponent } from './ow-roulette-add-to-team-modal.component';

export interface RouletteEntry {
  id: string;
  name: string;
  battletag?: string | null;
  displayName?: string | null;
}

// Mantido por compatibilidade com imports existentes.
export type Restaurant = RouletteEntry;

@Component({
  selector: 'ow-roulette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, OwRouletteRosterComponent, OwRouletteSelectedComponent, CardComponent],
  templateUrl: './ow-roulette.component.html',
})
export class OwRouletteComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modal = inject(ModalService);

  readonly items = input<readonly RouletteEntry[] | null>(null);
  readonly itemSelected = output<RouletteEntry>();

  readonly isRunning = signal(false);
  readonly selectedEntry = signal<RouletteEntry | null>(null);
  readonly remainingItems = signal<RouletteEntry[]>([]);
  readonly slots = signal<RouletteEntry[]>([]);
  readonly nameDraft = signal('');

  private readonly sourceList = signal<RouletteEntry[]>([]);
  private manualEntryCounter = 0;

  readonly sourceItems = computed<readonly RouletteEntry[]>(() => this.sourceList());

  readonly totalItems = computed(() => this.sourceItems().length);
  readonly drawnCount = computed(() => this.totalItems() - this.remainingItems().length);
  readonly canAddName = computed(() => !this.isRunning() && !!this.nameDraft().trim());

  readonly actionText = computed(() => {
    if (this.isRunning()) return 'Sorteando...';
    if (!this.totalItems()) return 'Adicione nomes';
    if (!this.remainingItems().length) return 'Lista concluída';
    if (!this.drawnCount()) return 'Iniciar roleta';
    return 'Sortear próximo';
  });

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly timingLms = 4800;

  constructor() {
    effect(() => {
      const incoming = this.normalizeIncomingItems(this.items());
      if (!incoming.length) return;
      this.replaceAllItems(incoming);
    });

    this.destroyRef.onDestroy(() => {
      if (this.timeoutId) clearTimeout(this.timeoutId);
    });
  }

  trackSlot(index: number, r: RouletteEntry): string {
    return `${r.id}-${index}`;
  }

  onNameDraftChange(value: string): void {
    this.nameDraft.set(value);
  }

  addName(event?: Event): void {
    event?.preventDefault();
    if (!this.canAddName()) return;

    const name = this.nameDraft().trim();
    const newEntry: RouletteEntry = {
      id: this.nextManualEntryId(),
      name,
    };

    this.sourceList.update((list) => [...list, newEntry]);
    this.remainingItems.update((list) => [...list, newEntry]);
    this.nameDraft.set('');
  }

  resetDraw(): void {
    if (this.isRunning()) return;
    this.remainingItems.set([...this.sourceItems()]);
    this.selectedEntry.set(null);
    this.slots.set([]);
  }

  runSlots(): void {
    if (this.isRunning()) return;

    const available = this.remainingItems();
    if (!available.length) return;

    const lastSelected = this.selectedEntry();

    this.selectedEntry.set(null);

    const selectedIndex = Math.floor(Math.random() * available.length);
    const trimmed = available.slice(0, selectedIndex + 1);

    let scrollSlots = [...available, ...available];
    if (lastSelected) scrollSlots = [lastSelected, ...scrollSlots];

    this.slots.set([...scrollSlots, ...trimmed]);

    this.isRunning.set(true);

    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      const selected = available[selectedIndex] ?? null;

      this.selectedEntry.set(selected);
      if (selected) {
        this.itemSelected.emit(selected);
        this.remainingItems.update((list) => {
          const index = list.indexOf(selected);
          if (index < 0) return list;
          return [...list.slice(0, index), ...list.slice(index + 1)];
        });
      }

      this.slots.set(selected ? [selected] : []);
      this.isRunning.set(false);
      this.timeoutId = null;
    }, this.timingLms);
  }

  openAddToTeamModal(): void {
    const entry = this.selectedEntry();
    if (!entry) return;

    this.modal
      .open(OwRouletteAddToTeamModalComponent, { entry })
      .afterClosed()
      .then(() => {
        // Sem acao adicional por enquanto.
      });
  }

  private replaceAllItems(items: readonly RouletteEntry[]): void {
    const normalized = items.map((item) => ({ ...item }));

    this.sourceList.set(normalized);
    this.remainingItems.set([...normalized]);
    this.selectedEntry.set(null);
    this.slots.set([]);
    this.isRunning.set(false);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private normalizeIncomingItems(items: readonly RouletteEntry[] | null): RouletteEntry[] {
    if (!items?.length) return [];

    const normalized = items
      .map<RouletteEntry | null>((item, index) => {
        const name = typeof item.name === 'string' ? item.name.trim() : '';
        if (!name) return null;

        const idRaw = typeof item.id === 'string' ? item.id.trim() : '';
        const id = idRaw || `imported-${index + 1}`;

        const battletag =
          typeof item.battletag === 'string' && item.battletag.trim()
            ? item.battletag.trim()
            : undefined;
        const displayName =
          typeof item.displayName === 'string' && item.displayName.trim()
            ? item.displayName.trim()
            : undefined;

        return { id, name, battletag, displayName };
      })
      .filter((item): item is RouletteEntry => item !== null);

    this.manualEntryCounter = normalized.length;
    return normalized;
  }

  private nextManualEntryId(): string {
    this.manualEntryCounter += 1;
    return `manual-${this.manualEntryCounter}`;
  }
}
