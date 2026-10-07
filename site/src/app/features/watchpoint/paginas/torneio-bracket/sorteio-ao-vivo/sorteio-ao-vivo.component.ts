import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ButtonsComponent } from '../../../../../shared/buttons/buttons';

export interface SorteioTeam {
  readonly id: string;
  readonly name: string;
  readonly logoUrl: string | null;
}

export type SorteioPhase = 'idle' | 'spinning' | 'flying' | 'done';

/** Par de seeds de uma partida do WB R1. */
export interface SorteioPair {
  readonly matchNumber: number;
  readonly seed1: number;
  readonly seed2: number;
}

/** Estado do card que viaja da roleta até o slot da chave. */
interface FlyState {
  readonly team: SorteioTeam;
  readonly seed: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly dx: number;
  readonly dy: number;
  readonly scale: number;
}

const SPIN_MS = 3400;
const FLIGHT_MS = 950;
const AUTO_PAUSE_MS = 900;

/**
 * Palco de sorteio ao vivo dos times.
 *
 * A roleta gira os nomes ainda não sorteados; quando um time é escolhido,
 * o card dele voa da roleta até o slot de seed correspondente na chave vazia.
 * Pensado para transmissão: cada giro é disparado manualmente ou em modo automático.
 */
@Component({
  selector: 'app-sorteio-ao-vivo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent],
  templateUrl: './sorteio-ao-vivo.component.html',
})
export class SorteioAoVivoComponent implements OnInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Times que entram no sorteio (já filtrados pela seleção do admin). */
  readonly teams = input.required<readonly SorteioTeam[]>();
  /** Tamanho da chave (4, 8, 16 ou 32). */
  readonly maxTeams = input.required<number>();
  /** Bloqueia os controles enquanto a chave está sendo criada. */
  readonly generating = input(false);

  /** Emitido quando todos os seeds foram preenchidos. */
  readonly concluded = output<Record<number, string>>();
  /** Pedido de geração da chave a partir do resultado do sorteio. */
  readonly generateRequested = output<Record<number, string>>();
  readonly closed = output<void>();

  readonly phase = signal<SorteioPhase>('idle');
  readonly autoMode = signal(false);
  readonly seedMap = signal<Record<number, string>>({});
  readonly availableSeeds = signal<readonly number[]>([]);
  readonly remaining = signal<readonly SorteioTeam[]>([]);
  readonly reelSlots = signal<readonly SorteioTeam[]>([]);
  readonly reelRunning = signal(false);
  readonly lastDrawn = signal<SorteioTeam | null>(null);
  readonly justLandedSeed = signal<number | null>(null);
  readonly fly = signal<FlyState | null>(null);
  readonly flyGo = signal(false);

  readonly spinMs = SPIN_MS;
  readonly flightMs = FLIGHT_MS;

  readonly drawnCount = computed(() => Object.keys(this.seedMap()).length);
  readonly busy = computed(() => this.phase() === 'spinning' || this.phase() === 'flying');
  readonly finished = computed(() => this.phase() === 'done');

  readonly canDraw = computed(
    () => !this.busy() && !this.finished() && this.remaining().length > 0 && !this.generating(),
  );

  readonly actionLabel = computed(() => {
    if (this.phase() === 'spinning') return 'Sorteando...';
    if (this.phase() === 'flying') return 'Posicionando...';
    if (this.finished()) return 'Sorteio concluído';
    if (this.drawnCount() === 0) return 'Iniciar sorteio';
    return 'Sortear próximo';
  });

  /** Partidas do WB R1 montadas a partir do tamanho da chave. */
  readonly pairs = computed<readonly SorteioPair[]>(() => {
    const n = this.maxTeams();
    return Array.from({ length: Math.floor(n / 2) }, (_, i) => ({
      matchNumber: i + 1,
      seed1: i * 2 + 1,
      seed2: i * 2 + 2,
    }));
  });

  private timers: ReturnType<typeof setTimeout>[] = [];
  private started = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  /** Inicializa (ou reinicia) o palco com os times recebidos. */
  reset(): void {
    this.clearTimers();
    const n = this.maxTeams();
    this.seedMap.set({});
    this.availableSeeds.set(Array.from({ length: n }, (_, i) => i + 1));
    this.remaining.set([...this.teams()]);
    this.reelSlots.set([]);
    this.reelRunning.set(false);
    this.lastDrawn.set(null);
    this.justLandedSeed.set(null);
    this.fly.set(null);
    this.flyGo.set(false);
    this.phase.set('idle');
    this.autoMode.set(false);
    this.started = true;
  }

  ngOnInit(): void {
    if (!this.started) this.reset();
  }

  toggleAuto(): void {
    const next = !this.autoMode();
    this.autoMode.set(next);
    if (next && this.canDraw()) this.drawNext();
  }

  drawNext(): void {
    if (!this.canDraw()) return;

    const pool = this.remaining();
    const index = Math.floor(Math.random() * pool.length);
    const chosen = pool[index];

    // Fita da roleta: duas voltas completas terminando no time sorteado.
    const scroll = [...pool, ...pool];
    const tail = pool.slice(0, index + 1);
    this.reelSlots.set([...scroll, ...tail]);
    this.reelRunning.set(true);
    this.phase.set('spinning');
    this.lastDrawn.set(null);

    this.after(SPIN_MS, () => {
      this.lastDrawn.set(chosen);
      this.reelSlots.set([chosen]);
      this.reelRunning.set(false);
      this.launch(chosen);
    });
  }

  close(): void {
    this.clearTimers();
    this.closed.emit();
  }

  requestGenerate(): void {
    if (!this.finished()) return;
    this.generateRequested.emit({ ...this.seedMap() });
  }

  // ── Helpers de template ───────────────────────────────────

  teamAtSeed(seed: number): SorteioTeam | null {
    const teamId = this.seedMap()[seed];
    if (!teamId) return null;
    return this.teams().find((t) => t.id === teamId) ?? null;
  }

  initials(name: string): string {
    return name.trim().substring(0, 2).toUpperCase();
  }

  trackSlot(index: number, team: SorteioTeam): string {
    return `${team.id}-${index}`;
  }

  /** translateY que leva a fita até o último item (o time sorteado). */
  reelTransform(): string {
    return this.reelRunning() ? 'translateY(calc(-100% + 5.5rem))' : 'translateY(0)';
  }

  flyTransform(): string {
    const state = this.fly();
    if (!state || !this.flyGo()) return 'translate(0px, 0px) scale(1)';
    return `translate(${state.dx}px, ${state.dy}px) scale(${state.scale})`;
  }

  // ── Privados ──────────────────────────────────────────────

  /** Mede roleta e slot de destino e dispara a viagem do card. */
  private launch(team: SorteioTeam): void {
    const seed = this.pickSeed();
    if (seed === null) {
      this.commit(team, null);
      return;
    }

    this.phase.set('flying');

    const from = this.rectOf('[data-fly-origin]');
    const to = this.rectOf(`[data-seed="${seed}"]`);

    if (!from || !to) {
      // Sem medidas (ex.: SSR) o time entra direto na chave, sem animação.
      this.commit(team, seed);
      return;
    }

    this.fly.set({
      team,
      seed,
      x: from.left,
      y: from.top,
      w: from.width,
      h: from.height,
      dx: to.left + to.width / 2 - (from.left + from.width / 2),
      dy: to.top + to.height / 2 - (from.top + from.height / 2),
      scale: Math.min(1, to.width / Math.max(from.width, 1)),
    });
    this.flyGo.set(false);

    // Dois frames: o primeiro pinta o card na origem, o segundo dispara a transição.
    this.nextFrame(() =>
      this.nextFrame(() => {
        this.flyGo.set(true);
        this.after(FLIGHT_MS, () => this.commit(team, seed));
      }),
    );
  }

  /** Sorteia uma posição livre da chave. */
  private pickSeed(): number | null {
    const available = this.availableSeeds();
    if (!available.length) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  private commit(team: SorteioTeam, seed: number | null): void {
    this.fly.set(null);
    this.flyGo.set(false);

    if (seed !== null) {
      this.seedMap.update((map) => ({ ...map, [seed]: team.id }));
      this.availableSeeds.update((list) => list.filter((s) => s !== seed));
      this.justLandedSeed.set(seed);
      this.after(1200, () => this.justLandedSeed.set(null));
    }

    this.remaining.update((list) => list.filter((t) => t.id !== team.id));

    const done = this.availableSeeds().length === 0 || this.remaining().length === 0;
    if (done) {
      this.phase.set('done');
      this.autoMode.set(false);
      this.concluded.emit({ ...this.seedMap() });
      return;
    }

    this.phase.set('idle');
    if (this.autoMode()) {
      this.after(AUTO_PAUSE_MS, () => {
        if (this.autoMode()) this.drawNext();
      });
    }
  }

  private rectOf(selector: string): DOMRect | null {
    if (!this.isBrowser) return null;
    const el = (this.host.nativeElement as HTMLElement).querySelector(selector);
    return el ? (el as HTMLElement).getBoundingClientRect() : null;
  }

  private nextFrame(fn: () => void): void {
    if (!this.isBrowser) {
      fn();
      return;
    }
    requestAnimationFrame(fn);
  }

  private after(ms: number, fn: () => void): void {
    const id = setTimeout(() => {
      this.timers = this.timers.filter((t) => t !== id);
      fn();
    }, ms);
    this.timers.push(id);
  }

  private clearTimers(): void {
    for (const id of this.timers) clearTimeout(id);
    this.timers = [];
  }
}
