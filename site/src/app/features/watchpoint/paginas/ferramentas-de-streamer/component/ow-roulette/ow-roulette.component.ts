import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';

export interface Restaurant {
  id: string;
  name: string;
}

@Component({
  selector: 'ow-roulette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <h1>
        It's lunch time
        @if (selectedRestaurant(); as r) { <span>at {{ r.name }}!</span> }
      </h1>

      <p>
        Making decisions is hard, like really hard. So, if the team can't decide where to go to lunch then just
        let the lunch time slot machine do it. It's time for lunch, where are we going?
      </p>

      <div class="slot-machine">
        <ul class="slot-list" [class.running]="isRunning()">
          @for (r of slots(); track trackSlot($index, r)) {
            <li>
              <p class="slot-text">{{ r.name }}</p>
            </li>
          }
        </ul>

        @if (!slots().length && remainingItems().length) {
          <button class="slot-text starter" type="button" (click)="runSlots()">
            What's for Lunch?
          </button>
        }
      </div>

      <button class="trigger" type="button" (click)="runSlots()" [disabled]="isRunning() || !remainingItems().length">
        {{ actionText() }}
      </button>

      <section class="draw-list" aria-live="polite">
        <h2>Lista do Sorteio</h2>
        <ul>
          @for (r of sourceItems(); track trackSlot($index, r)) {
            <li [class.drawn]="isDrawn(r)">{{ r.name }}</li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: [`
    @import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=swap");

    :host{
      --primary: #5fb3b3;
      --primary-lightest: #9be2e2;
      --primary-light: #79c2c4;
      --primary-dark: #1a8384;
      --ink: #0f1c23;
      --ink-light: #343d46;
      --timing-l: 5s;
      --timing-s: 0.5s;

      display: block;
      color: var(--ink-light);
      font-family: "IBM Plex Sans", sans-serif;
    }

    h1 {
      color: var(--ink);
      font-size: 1.75rem;
      font-weight: 700;
    }

    .container {
      box-sizing: content-box;
      max-width: 75ch;
      margin-left: auto;
      margin-right: auto;
      padding: max(1rem, 4vw);
    }

    .container > * + * { margin-top: var(--spacer, 1.5em); }
    .container > p { line-height: 1.6; }

    .slot-machine {
      height: 8rem;
      overflow: hidden;
      border: 2px solid var(--primary);
      position: relative;
    }

    .slot-list {
      list-style: none;
      margin: 0;
      padding: 0;
      transition: 0s;
    }

    .slot-text {
      background: transparent;
      border: none;
      display: grid;
      font-size: clamp(1.75rem, 2.25vw + 1rem, 4rem);
      font-weight: 700;
      height: 8rem;
      margin: 0;
      place-content: center;
      padding: 0;
      text-align: center;
      width: 100%;
    }

    .running {
      transform: translateY(calc(-100% + 8rem));
      transition: var(--timing-l) cubic-bezier(0.19, 0.97, 0.5, 1.005);
    }

    .starter { color: var(--primary-light); }

    .trigger {
      background-color: var(--primary);
      backface-visibility: hidden;
      border: none;
      color: white;
      display: flex;
      font-size: 1.25rem;
      font-weight: 700;
      justify-content: center;
      margin-left: auto;
      margin-right: auto;
      padding: 1rem;
      perspective: 10000px;
      position: relative;
      transform-style: preserve-3d;
      transition: transform var(--timing-s);
      width: 15rem;
    }

    .trigger::before,
    .trigger::after {
      background-color: var(--primary);
      backface-visibility: hidden;
      content: "";
      display: block;
      height: 1rem;
      position: absolute;
      top: 100%;
      transform: rotateX(-90deg);
      transform-origin: 50% 0%;
      width: 100%;
    }

    .trigger::after {
      background-color: var(--primary-dark);
      transform: rotateX(-90deg) scaleX(0);
      transition-delay: var(--timing-s);
    }

    .trigger:hover { background-color: var(--primary-dark); }

    .trigger:disabled {
      background-color: var(--primary-light);
      transform: rotateX(90deg);
    }

    .trigger:disabled::after {
      transform: rotateX(-90deg) scaleX(1);
      transform-origin: 0 0;
      transition: transform 4s linear var(--timing-s);
    }

    .draw-list {
      border: 1px solid var(--primary-light);
      padding: 1rem;
    }

    .draw-list h2 {
      color: var(--ink);
      font-size: 1rem;
      margin: 0 0 0.75rem 0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .draw-list ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.4rem;
      max-height: 16rem;
      overflow: auto;
    }

    .draw-list li {
      transition: opacity var(--timing-s), text-decoration-color var(--timing-s);
    }

    .draw-list li.drawn {
      text-decoration: line-through;
      opacity: 0.55;
    }
  `],
})
export class OwRouletteComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly items = input<readonly Restaurant[] | null>(null);
  readonly itemSelected = output<Restaurant>();

  readonly isRunning = signal(false);
  readonly selectedRestaurant = signal<Restaurant | null>(null);
  readonly remainingItems = signal<Restaurant[]>([]);
  readonly slots = signal<Restaurant[]>([]);
  readonly actionText = signal("I'm Hungry");
  readonly sourceItems = computed<readonly Restaurant[]>(() => this.items() ?? this.defaultRestaurants);

  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly timingLms = 5000;

  private readonly defaultRestaurants: readonly Restaurant[] = [
    { id: "1", name: "Brickhouse Pizza" },
    { id: "2", name: "Addies Thai House" },
    { id: "3", name: "Las Palmas" },
    { id: "4", name: "Companion Bakery" },
    { id: "4", name: "Wok Express" },
    { id: "5", name: "Qdoba" },
    { id: "6", name: "Dave and Tony's" },
    { id: "7", name: "Hu Hot" },
    { id: "8", name: "Sybergs" }
  ];

  constructor() {
    effect(() => {
      const source = this.sourceItems();
      this.remainingItems.set([...source]);
    });

    this.destroyRef.onDestroy(() => {
      if (this.timeoutId) clearTimeout(this.timeoutId);
    });
  }

  trackSlot(index: number, r: Restaurant): string {
    return `${r.id}-${index}`;
  }

  isDrawn(item: Restaurant): boolean {
    return !this.remainingItems().includes(item);
  }

  runSlots(): void {
    if (this.isRunning()) return;

    const available = this.remainingItems();
    if (!available.length) return;

    const lastSelected = this.selectedRestaurant();

    // limpa selecao atual
    this.selectedRestaurant.set(null);

    const selectedIndex = Math.floor(Math.random() * available.length);
    const trimmed = available.slice(0, selectedIndex + 1);

    let scrollSlots = [...available, ...available];
    if (lastSelected) scrollSlots = [lastSelected, ...scrollSlots];

    this.slots.set([...scrollSlots, ...trimmed]);

    this.isRunning.set(true);

    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      const selected = available[selectedIndex] ?? null;

      this.selectedRestaurant.set(selected);
      if (selected) {
        this.itemSelected.emit(selected);
        this.remainingItems.update(list => {
          const index = list.indexOf(selected);
          if (index < 0) return list;
          return [...list.slice(0, index), ...list.slice(index + 1)];
        });
      }

      this.slots.set(selected ? [selected] : []);
      this.actionText.set(this.remainingItems().length ? "Nah, Something Else" : "No More Items");
      this.isRunning.set(false);
    }, this.timingLms);
  }
}
