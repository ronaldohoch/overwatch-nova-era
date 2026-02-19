import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ow-stats-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="
        bg-[color:var(--ow-white)]
        border border-[color:var(--ow-gray-200)]
        shadow-[var(--shadow-card)]
        overflow-hidden
        transition-all duration-300 ease-in-out
        [clip-path:polygon(5%_0,100%_0,100%_95%,95%_100%,0_100%,0_5%)]
        hover:border-[color:var(--ow-orange)]
        hover:shadow-[var(--shadow-card-hover)]
        hover:-translate-y-[5px]
        p-6
      "
    >
      <h3 class="text-lg font-bold uppercase tracking-wider text-[color:var(--ow-orange)] mb-4">
        {{ title() }}
      </h3>

      <div class="text-5xl font-black mb-2">
        {{ value() }}
      </div>

      <div class="text-[color:var(--ow-gray-500)] text-sm">
        {{ subtitle() }}
      </div>

      <div
        class="mt-4 bg-[color:var(--ow-gray-200)] h-2 rounded-full overflow-hidden"
        role="progressbar"
        [attr.aria-label]="progressAriaLabel()"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="100"
        [attr.aria-valuenow]="progressPct()"
      >
        <div
          class="bg-[color:var(--ow-orange)] h-full"
          [style.width.%]="progressPct()"
        ></div>
      </div>
    </div>
  `,
})
export class StatsCardComponent {
  title = input.required<string>();
  value = input.required<string | number>();
  subtitle = input.required<string>();

  /** 0..100 */
  progress = input<number>(0);

  /** Ex: "Progresso de partidas jogadas" */
  ariaLabel = input<string>('Progresso');

  progressPct = computed(() => {
    const v = this.progress();
    if (!Number.isFinite(v)) return 0;
    return Math.min(100, Math.max(0, v));
  });

  progressAriaLabel = computed(() => this.ariaLabel());
}
