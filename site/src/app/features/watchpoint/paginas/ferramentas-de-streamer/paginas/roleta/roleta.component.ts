import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { OwRouletteComponent, type RouletteEntry } from '../../component/ow-roulette/ow-roulette.component';
import { ModalHostComponent } from '../../../../../../shared/modal/modal-host.component';
import { OW_ROULETTE_SESSION_STORAGE_KEY, type OwRouletteListItem } from './ow-roulette-session-storage';

@Component({
  selector: 'app-roleta',
  imports: [OwRouletteComponent, ModalHostComponent],
  templateUrl: './roleta.component.html',
  styleUrl: './roleta.component.css',
})
export class RoletaComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly rouletteItems = signal<readonly RouletteEntry[] | null>(null);
  readonly importedCount = computed(() => this.rouletteItems()?.length ?? 0);

  constructor() {
    this.loadRouletteItemsFromSessionStorage();
  }

  private loadRouletteItemsFromSessionStorage(): void {
    const storage = this.getSessionStorage();
    if (!storage) return;

    const raw = storage.getItem(OW_ROULETTE_SESSION_STORAGE_KEY);
    if (!raw) return;

    storage.removeItem(OW_ROULETTE_SESSION_STORAGE_KEY);

    try {
      const parsed = JSON.parse(raw);
      const items = this.readRouletteItems(parsed);
      if (items.length) this.rouletteItems.set(items);
    } catch {
      // Ignora payload invalido para manter fallback da roleta.
    }
  }

  private getSessionStorage(): Storage | null {
    if (!this.isBrowser) return null;
    if (typeof window === 'undefined') return null;
    if (!('sessionStorage' in window)) return null;

    return window.sessionStorage;
  }

  private readRouletteItems(value: unknown): readonly RouletteEntry[] {
    if (!Array.isArray(value)) return [];

    return value
      .filter((item): item is Record<string, unknown> => this.isRecord(item))
      .map((item, index) => {
        const name = this.readString(item, 'name');
        if (!name) return null;

        const id = this.readString(item, 'id') ?? `item-${index + 1}`;
        const rouletteItem: OwRouletteListItem = {
          id,
          name,
          battletag: this.readString(item, 'battletag'),
          displayName: this.readString(item, 'displayName'),
        };
        return rouletteItem;
      })
      .filter((item): item is RouletteEntry => item !== null);
  }

  private readString(value: Record<string, unknown>, field: string): string | null {
    const raw = value[field];
    if (typeof raw !== 'string') return null;

    const normalized = raw.trim();
    return normalized ? normalized : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
}
