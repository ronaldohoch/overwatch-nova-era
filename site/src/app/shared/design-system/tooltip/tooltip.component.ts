import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Tooltip wrapper: envolve o elemento alvo com `ow-tooltip` e passa o texto via `text`.
 *
 * Uso:
 * ```html
 * <ow-tooltip text="Quartas de Final — 21 Ago">
 *   <ow-btn variant="secondary" size="sm">Hover aqui</ow-btn>
 * </ow-tooltip>
 * ```
 */
@Component({
  selector: 'ow-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-block group/tooltip">
      <ng-content />
      <div
        class="
          absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2
          bg-[#202124] text-white
          text-[0.75rem] font-semibold
          py-[6px] px-3 whitespace-nowrap
          [clip-path:polygon(5%_0,100%_0,95%_100%,0_100%)]
          opacity-0 pointer-events-none
          transition-opacity duration-200
          group-hover/tooltip:opacity-100
          z-50
        "
        role="tooltip"
      >{{ text() }}</div>
    </div>
  `,
  host: { class: 'contents' },
})
export class TooltipComponent {
  readonly text = input.required<string>();
}
