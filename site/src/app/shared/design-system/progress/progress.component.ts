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
            <span class="text-[0.8rem] font-bold text-[#3c4043]">{{ label() }}</span>
          }
          @if (showValue()) {
            <span class="text-[0.8rem] font-extrabold" [class]="valueColorClass()">{{ value() }}%</span>
          }
        </div>
      }
      <div
        class="h-[10px] bg-[#f1f3f4] overflow-hidden [clip-path:polygon(1%_0,100%_0,99%_100%,0%_100%)]"
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
    orange: 'bg-[linear-gradient(135deg,#f06314_0%,#d14e0a_100%)]',
    blue: 'bg-[linear-gradient(135deg,#00c3ff_0%,#0099cc_100%)]',
    green: 'bg-[linear-gradient(135deg,#34a853_0%,#2d7d3a_100%)]',
  };

  private readonly VALUE_COLORS: Record<OwProgressColor, string> = {
    orange: 'text-[#f06314]',
    blue: 'text-[#00c3ff]',
    green: 'text-[#34a853]',
  };

  readonly clampedValue = computed(() => Math.min(100, Math.max(0, this.value())));
  readonly barClass = computed(() => this.BAR_VARIANTS[this.color()]);
  readonly valueColorClass = computed(() => this.VALUE_COLORS[this.color()]);
}
