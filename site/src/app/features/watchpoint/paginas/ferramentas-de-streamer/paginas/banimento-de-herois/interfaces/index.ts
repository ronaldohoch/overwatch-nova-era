export type HeroRole = 'Tank' | 'Damage' | 'Support';

export type HeroSubrole =
  | 'Initiator'
  | 'Bruiser'
  | 'Stalwart'
  | 'Specialist'
  | 'Recon'
  | 'Flanker'
  | 'Sharpshooter'
  | 'Tactician'
  | 'Medic'
  | 'Survivor';

export type RoleFilter = 'all' | HeroRole;

export type BanTeam = 1 | 2;

export interface RawHero {
  name: string;
  avatar: string;
  role: HeroRole;
  subrole: HeroSubrole;
}

export interface Hero extends RawHero {
  key: string;
  localImage: string;
}

export interface HeroGroup {
  subrole: HeroSubrole;
  subroleLabel: string;
  heroes: Hero[];
}

export interface BanSlot {
  hero: Hero | null;
  isActive: boolean;
}

export interface RoleCounts {
  all: number;
  Tank: number;
  Damage: number;
  Support: number;
}

export interface TeamOption {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface SetupResult {
  team1: TeamOption;
  team2: TeamOption;
  banCount: 1 | 2 | 3;
}
