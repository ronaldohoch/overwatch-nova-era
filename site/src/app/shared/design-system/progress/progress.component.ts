import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type OwProgressColor = 'orange' | 'blue' | 'green';

@Component({
  selector: 'ow-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      @if (label() || showValue()) {
        <div class="flex justify-between items-center mb-[6px]">
          @if (label()) {
            <span class="text-[0.8rem] font-bold text-(--ow-text)">{{ label() }}</span>
          }
          @if (showValue()) {
            <span class="text-[0.8rem] font-extrabold" [class]="valueColorClass()">{{ value() }}%</span>
          }
        </div>
      }
      <div
        class="h-[10px] bg-(--ow-surface-sunken) overflow-hidden [clip-path:polygon(1%_0,100%_0,99%_100%,0%_100%)]"
        role="progressbar"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="100"
        [attr.aria-label]="label() ?? 'Progresso'"
      >
        <div
          [class]="barClass()"
          [style.width.%]="clampedValue()"
          class="h-full transition-[width] duration-1000 ease-in-out [clip-path:polygon(0_0,100%_0,99%_100%,0_100%)]"
        ></div>
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class ProgressComponent {
  readonly label = input<string | undefined>(undefined);
  readonly value = input(0);
  readonly color = input<OwProgressColor>('orange');
  readonly showValue = input(true);

  private readonly BAR_VARIANTS: Record<OwProgressColor, string> = {
    orange: 'bg-[image:var(--gradient-orange)]',
    blue: 'bg-[image:var(--gradient-blue)]',
    green: 'bg-[image:var(--gradient-green)]',
  };

  private readonly VALUE_COLORS: Record<OwProgressColor, string> = {
    orange: 'text-(--ow-orange)',
    blue: 'text-(--ow-blue)',
    green: 'text-(--ow-green)',
  };

  readonly clampedValue = computed(() => Math.min(100, Math.max(0, this.value())));
  readonly barClass = computed(() => this.BAR_VARIANTS[this.color()]);
  readonly valueColorClass = computed(() => this.VALUE_COLORS[this.color()]);
}
