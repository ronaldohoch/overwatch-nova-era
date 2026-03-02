import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import heroesData from './herois.json';
import { SetupBanimentoComponent } from './setup-banimento/setup-banimento.component';
import type {
  BanSlot,
  BanTeam,
  Hero,
  HeroGroup,
  HeroSubrole,
  RawHero,
  RoleFilter,
  RoleCounts,
  SetupResult,
} from './interfaces';

const SUBROLE_LABELS: Record<HeroSubrole, string> = {
  Initiator: 'Incursão',
  Bruiser: 'Combate',
  Stalwart: 'Robustez',
  Specialist: 'Especialidade',
  Recon: 'Reconhecimento',
  Flanker: 'Flanqueamento',
  Sharpshooter: 'Artilharia',
  Tactician: 'Estratégia',
  Medic: 'Restauração',
  Survivor: 'Sobrevivência',
};

const SUBROLE_ORDER: Record<HeroSubrole, number> = {
  Initiator: 0,
  Bruiser: 1,
  Stalwart: 2,
  Specialist: 3,
  Recon: 4,
  Flanker: 5,
  Sharpshooter: 6,
  Tactician: 7,
  Medic: 8,
  Survivor: 9,
};

const TIMER_START = 60;

function buildHeroes(): Hero[] {
  return (heroesData as RawHero[]).map((h) => {
    const key =
      h.avatar.split('/').pop()?.replace('.png', '') ??
      h.name.toLowerCase().replace(/\s+/g, '-');
    return { ...h, key, localImage: `/imgs/overwatch_heroes/${key}.png` };
  });
}

@Component({
  selector: 'app-banimento-de-herois',
  imports: [SetupBanimentoComponent],
  templateUrl: './banimento-de-herois.component.html',
  styleUrl: './banimento-de-herois.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BanimentoDeHeroisComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly allHeroes: Hero[] = buildHeroes();

  // Setup state
  readonly isStarted = signal(false);
  readonly team1Name = signal('Time 1');
  readonly team2Name = signal('Time 2');
  readonly team1Logo = signal<string | null>(null);
  readonly team2Logo = signal<string | null>(null);
  readonly banCount = signal<1 | 2 | 3>(3);

  // Game state
  readonly roleFilter = signal<RoleFilter>('all');
  readonly searchQuery = signal('');
  readonly banIndex = signal(0);
  readonly bans = signal<{ 1: string[]; 2: string[] }>({ 1: [], 2: [] });
  readonly timerValue = signal(TIMER_START);

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  // Computed: dynamic ban sequence based on ban count
  readonly banSequence = computed((): BanTeam[] => {
    const count = this.banCount();
    const seq: BanTeam[] = [];
    for (let i = 0; i < count; i++) seq.push(1, 2);
    return seq;
  });

  readonly bannedKeys = computed(() => {
    const b = this.bans();
    return new Set([...b[1], ...b[2]]);
  });

  readonly isOver = computed(() => this.banIndex() >= this.banSequence().length);

  readonly currentTeam = computed((): BanTeam | 0 => {
    if (this.isOver()) return 0;
    return this.banSequence()[this.banIndex()];
  });

  readonly filteredGroups = computed((): HeroGroup[] => {
    const filter = this.roleFilter();
    const query = this.searchQuery().toLowerCase().trim();

    let heroes = this.allHeroes;
    if (filter !== 'all') heroes = heroes.filter((h) => h.role === filter);
    if (query)
      heroes = heroes.filter(
        (h) =>
          h.name.toLowerCase().includes(query) ||
          SUBROLE_LABELS[h.subrole].toLowerCase().includes(query),
      );

    const map = new Map<HeroSubrole, Hero[]>();
    for (const hero of heroes) {
      if (!map.has(hero.subrole)) map.set(hero.subrole, []);
      map.get(hero.subrole)!.push(hero);
    }

    return [...map.entries()]
      .sort(([a], [b]) => SUBROLE_ORDER[a] - SUBROLE_ORDER[b])
      .map(([subrole, subroleHeroes]) => ({
        subrole,
        subroleLabel: SUBROLE_LABELS[subrole],
        heroes: subroleHeroes,
      }));
  });

  readonly roleCounts = computed((): RoleCounts => {
    const query = this.searchQuery().toLowerCase().trim();
    let heroes = this.allHeroes;
    if (query)
      heroes = heroes.filter(
        (h) =>
          h.name.toLowerCase().includes(query) ||
          SUBROLE_LABELS[h.subrole].toLowerCase().includes(query),
      );
    return {
      all: heroes.length,
      Tank: heroes.filter((h) => h.role === 'Tank').length,
      Damage: heroes.filter((h) => h.role === 'Damage').length,
      Support: heroes.filter((h) => h.role === 'Support').length,
    };
  });

  readonly timerClasses = computed((): string => {
    if (this.isOver()) return 'border-green-500 text-green-500';
    if (this.timerValue() <= 10) return 'border-red-500 text-red-500 timer-pulse';
    return 'border-orange-500';
  });

  ngOnDestroy(): void {
    this.clearTimer();
  }

  onSetupConfirmed(result: SetupResult): void {
    this.team1Name.set(result.team1.name);
    this.team2Name.set(result.team2.name);
    this.team1Logo.set(result.team1.logoUrl ?? null);
    this.team2Logo.set(result.team2.logoUrl ?? null);
    this.banCount.set(result.banCount);
    this.isStarted.set(true);
    if (isPlatformBrowser(this.platformId)) {
      this.startTimer();
    }
  }

  banHero(hero: Hero): void {
    if (this.isOver() || this.bannedKeys().has(hero.key)) return;

    const team = this.banSequence()[this.banIndex()];
    const current = this.bans();
    this.bans.set({ ...current, [team]: [...current[team], hero.key] });
    this.banIndex.update((i) => i + 1);

    if (this.isOver()) {
      this.clearTimer();
    } else {
      this.startTimer();
    }
  }

  setRoleFilter(filter: RoleFilter): void {
    this.roleFilter.set(filter);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  getBanSlots(team: BanTeam): BanSlot[] {
    const bans = this.bans()[team];
    const currentTeam = this.currentTeam();
    const count = this.banCount();
    return Array.from({ length: count }, (_, i) => ({
      hero: bans[i] ? (this.allHeroes.find((h) => h.key === bans[i]) ?? null) : null,
      isActive: !this.isOver() && currentTeam === team && bans.length === i,
    }));
  }

  getSlotClasses(slot: BanSlot): string {
    const base =
      'w-14 h-14 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300 border-2';
    if (slot.hero) return `${base} border-solid border-red-800 bg-gray-50`;
    if (slot.isActive) return `${base} border-solid border-orange-500 bg-gray-100 slot-pulse`;
    return `${base} border-dashed border-gray-300 bg-gray-100`;
  }

  getHeroCellClasses(hero: Hero): string {
    const base = 'relative aspect-square rounded-[10px] p-1 transition-all duration-200';
    if (this.bannedKeys().has(hero.key))
      return `${base} cursor-not-allowed pointer-events-none`;
    if (this.isOver()) return `${base} cursor-default pointer-events-none opacity-60`;
    return `${base} cursor-pointer group hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]`;
  }

  getHeroFrameStyle(hero: Hero): string {
    return this.bannedKeys().has(hero.key)
      ? 'linear-gradient(145deg, #a01830 0%, #6e1020 40%, #a01830 60%, #801428 100%)'
      : 'linear-gradient(145deg, #50505e 0%, #2e2e3a 40%, #50505e 60%, #3a3a48 100%)';
  }

  getHeroImageFilter(hero: Hero): string {
    return this.bannedKeys().has(hero.key) ? 'grayscale(50%) brightness(45%)' : '';
  }

  private startTimer(): void {
    this.clearTimer();
    this.timerValue.set(TIMER_START);
    this.timerInterval = setInterval(() => {
      const v = this.timerValue();
      if (v <= 1) {
        this.clearTimer();
        this.timerValue.set(0);
        this.autoBan();
        return;
      }
      this.timerValue.set(v - 1);
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private autoBan(): void {
    if (this.isOver()) return;
    const available = this.allHeroes.filter((h) => !this.bannedKeys().has(h.key));
    if (!available.length) return;
    this.banHero(available[Math.floor(Math.random() * available.length)]);
  }
}
