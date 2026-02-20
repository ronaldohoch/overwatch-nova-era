import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { type UserRole } from '../auth/user-role';
import { LinksComponent } from './components/links/links.component';
import { ButtonsComponent } from '../../shared/buttons/buttons';

export type OwNavItem = Readonly<{
  label: string;
  link: string;
  exact?: boolean;
}>;

const DEFAULT_LINKS: readonly OwNavItem[] = [
    { label: 'Início', link: '/', exact: true },
    { label: 'Dúvidas frequêntes', link: '/duvidas-frequentes' },
    // { label: 'Torneio', link: '/torneio' },
    // { label: 'Times', link: '/times' },
    // { label: 'Agenda', link: '/agenda' },
    { label: 'Regras', link: '/regras' },
];

const MEMBER_LINKS: readonly OwNavItem[] = [
  { label: 'Dashboard', link: '/watchpoint/dashboard' },
  { label: 'Meus dados', link: '/watchpoint/dados-do-usuario' },
  { label: 'Check-in', link: '/watchpoint/check-ins' },
  // { label: 'Torneio', link: '/torneio' },
];

const STREAMER_LINKS: readonly OwNavItem[] = [
  { label: 'Dashboard', link: '/watchpoint/dashboard' },
  { label: 'Meus dados', link: '/watchpoint/dados-do-usuario' },
  { label: 'Check-ins', link: '/watchpoint/check-ins' },
  { label: 'Fazer check-in', link: '/watchpoint/check-in-by-tournament' },
  { label: 'Ferramentas', link: '/watchpoint/ferramentas-de-streamer' },
];

const ADMIN_LINKS: readonly OwNavItem[] = [
  { label: 'Dashboard', link: '/watchpoint/dashboard' },
  { label: 'Meus dados', link: '/watchpoint/dados-do-usuario' },
  { label: 'Torneios', link: '/watchpoint/torneios' },
  { label: 'Usuarios', link: '/watchpoint/usuarios' },
  // { label: 'Gestao do torneio', link: '/torneio' }
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
