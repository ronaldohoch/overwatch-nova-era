import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="theme.toggle()"
      [attr.aria-pressed]="theme.isDark()"
      [attr.aria-label]="label()"
      [title]="label()"
      class="inline-flex cursor-pointer items-center gap-2 border border-(--ow-border) bg-(--ow-surface-raised) px-4 py-2 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-(--ow-text-muted) transition-colors duration-300 [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] hover:border-(--ow-orange) hover:text-(--ow-orange-text) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ow-orange) focus-visible:ring-offset-2 focus-visible:ring-offset-(--ow-bg)"
    >
      @if (theme.isDark()) {
        <!-- Sol: clicar volta para o tema claro -->
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        Tema claro
      } @else {
        <!-- Lua: clicar volta para o tema escuro -->
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
        Tema escuro
      }
    </button>
  `,
  host: { class: 'contents' },
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);

  readonly label = computed(() =>
    this.theme.isDark() ? 'Mudar para o tema claro' : 'Mudar para o tema escuro',
  );
}
