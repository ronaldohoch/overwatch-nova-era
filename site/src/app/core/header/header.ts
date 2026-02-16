import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LinksComponent } from './components/links/links.component';

export type OwNavItem = Readonly<{
  label: string;
  link: string;
  exact?: boolean;
}>;

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LinksComponent],
  templateUrl:'./header.html'
})
export class Header {
  readonly brandLink = input<string>('/');
  readonly brandHighlight = input<string>('OVERWATCH');
  readonly brandText = input<string>('CHAMPIONSHIP');

  readonly items = input<readonly OwNavItem[] | null>(null);

  private readonly defaults: readonly OwNavItem[] = [
    { label: 'Início', link: '/', exact: true },
    { label: 'Dúvidas frequêntes', link: '/duvidas-frequentes' },
    // { label: 'Times', link: '/times' },
    // { label: 'Agenda', link: '/agenda' },
    { label: 'Regras', link: '/regras' },
  ];

  readonly navItems = computed(() => this.items() ?? this.defaults);

  readonly mobileOpen = signal(false);
  readonly mobileMenuId = 'ow-mobile-menu';

  toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
