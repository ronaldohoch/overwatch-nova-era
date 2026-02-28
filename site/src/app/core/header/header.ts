import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { type UserRole } from '../auth/user-role';
import { LinksComponent } from './components/links/links.component';
import { ButtonsComponent } from '../../shared/buttons/buttons';
import { environment } from '../../../environments/environment';

export type OwNavItem = Readonly<{
  label: string;
  link: string;
  exact?: boolean;
}>;

const DEFAULT_LINKS: readonly OwNavItem[] = [
    { label: 'Início', link: '/', exact: true },
    { label: 'Dúvidas frequentes', link: '/duvidas-frequentes' },
    { label: 'Torneio', link: `/torneios/${environment.TOURNAMENT_ID}` },
    // { label: 'Times', link: '/times' },
    // { label: 'Agenda', link: '/agenda' },
    { label: 'Regras', link: '/regras' },
];

const MEMBER_LINKS: readonly OwNavItem[] = [
  { label: 'Times', link: '/watchpoint/times' },
  // { label: 'Torneio', link: '/torneio' },
];

const STREAMER_LINKS: readonly OwNavItem[] = [
  { label: 'Times', link: '/watchpoint/times' },
  { label: 'Check-ins', link: '/watchpoint/check-in-by-tournament' },
  { label: 'Ferramentas', link: '/watchpoint/ferramentas-de-streamer' },
];

const ADMIN_LINKS: readonly OwNavItem[] = [
  { label: 'Times', link: '/watchpoint/times' },
  { label: 'Torneios', link: '/watchpoint/torneios' },
  { label: 'Usuários', link: '/watchpoint/usuarios' },
  // { label: 'Gestão do torneio', link: '/torneio' }
];

const ADMIN_ALL_LINKS = uniqueByLink([
  ...ADMIN_LINKS,
  ...STREAMER_LINKS,
  ...MEMBER_LINKS,
  // ...DEFAULT_LINKS,
]);

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LinksComponent, ButtonsComponent],
  templateUrl: './header.html',
})
export class Header {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly brandLink = input<string>('/');
  readonly items = input<readonly OwNavItem[] | null>(null);

  readonly defaultsLinks = DEFAULT_LINKS;

  readonly loggedInLinks = computed<readonly OwNavItem[]>(() => {
    const role = this.auth.userRole();
    if (role === 'admin') return ADMIN_ALL_LINKS;
    if (role === 'streamer') return STREAMER_LINKS;
    return MEMBER_LINKS;
  });
  readonly compactLoggedLinks = computed(() => {
    const role = this.auth.userRole();
    return role === 'admin' || role === 'streamer';
  });

  readonly userDisplayName = computed(() => this.auth.displayName() ?? 'Jogador');
  readonly userRoleLabel = computed(() => this.resolveRoleLabel(this.auth.userRole()));
  readonly userProfileLink = '/watchpoint/dados-do-usuario';
  readonly loggedInBrandLink = '/watchpoint/dashboard';
  readonly brandRouterLink = computed(() =>
    this.auth.isAuthenticated() ? this.loggedInBrandLink : this.brandLink(),
  );
  readonly brandLogoSrc = computed(() =>
    this.auth.isAuthenticated() ? '/imgs/logo-nova-era.webp' : '/imgs/logo-nova-era-low-res.webp',
  );
  readonly brandLogoAlt = computed(() =>
    this.auth.isAuthenticated() ? 'Logo Watchpoint' : 'Logo Copa Overwatch Nova Era',
  );
  readonly mobileOpen = signal(false);
  readonly mobileMenuId = 'ow-mobile-menu';

  toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.closeMobile();
    void this.router.navigateByUrl('/');
  }

  private resolveRoleLabel(role: UserRole | null): string {
    if (role === 'admin') return 'Admin';
    if (role === 'streamer') return 'Streamer';
    return 'Membro';
  }
}

function uniqueByLink(items: readonly OwNavItem[]): OwNavItem[] {
  const seen = new Set<string>();
  const result: OwNavItem[] = [];

  for (const item of items) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);
    result.push(item);
  }

  return result;
}
