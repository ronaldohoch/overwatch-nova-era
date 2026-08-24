import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'ds-code-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative bg-(--ow-code-bg) overflow-hidden">
      <div class="flex items-center justify-between px-4 py-2 bg-(--ow-code-gutter) border-b border-(--ow-code-surface)">
        <span class="text-[0.62rem] font-mono font-semibold text-(--ow-code-muted) uppercase tracking-[0.15em]">Angular Template</span>
        <button
          type="button"
          class="text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-(--ow-code-muted) hover:text-(--ow-code-text) transition-colors flex items-center gap-1.5"
          (click)="copy()">
          @if (copied()) {
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L4.5 8.5L10 3" stroke="var(--ow-code-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="text-(--ow-code-accent)">Copiado!</span>
          } @else {
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="3" y="1" width="7" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/>
              <rect x="1" y="3" width="7" height="8" rx="1" stroke="currentColor" stroke-width="1.2" fill="var(--ow-code-bg)"/>
            </svg>
            Copiar
          }
        </button>
      </div>
      <pre class="p-5 text-[0.8rem] font-mono leading-[1.75] text-(--ow-code-text) overflow-x-auto m-0 whitespace-pre"><code>{{ code() }}</code></pre>
    </div>
  `,
})
export class DsCodeBlockComponent {
  readonly code = input.required<string>();
  protected readonly copied = signal(false);

  protected copy(): void {
    navigator.clipboard.writeText(this.code()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
