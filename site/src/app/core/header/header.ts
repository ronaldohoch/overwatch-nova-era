import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { LinksComponent } from './components/links/links.component';
import { ButtonsComponent } from '../../shared/buttons/buttons';

export type OwNavItem = Readonly<{
  label: string;
  link: string;
  exact?: boolean;
}>;

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LinksComponent, ButtonsComponent],
  templateUrl:'./header.html'
})
export class Header {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly brandLink = input<string>('/');
  readonly brandHighlight = input<string>('OVERWATCH');
  readonly brandText = input<string>('CHAMPIONSHIP');

  readonly items = input<readonly OwNavItem[] | null>(null);

  private readonly defaults: readonly OwNavItem[] = [
    { label: 'Início', link: '/', exact: true },
    // { label: 'Dúvidas frequêntes', link: '/duvidas-frequentes' },
    { label: 'Torneio', link: '/torneio' },
    // { label: 'Times', link: '/times' },
    // { label: 'Agenda', link: '/agenda' },
    { label: 'Regras', link: '/regras' },
  ];

  readonly navItems = computed(() => this.items() ?? this.defaults);
  readonly userDisplayName = computed(() => this.auth.displayName() ?? 'Jogador');

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
}
