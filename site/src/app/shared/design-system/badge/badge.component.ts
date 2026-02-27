import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type OwBadgeVariant =
  | 'orange'
  | 'blue'
  | 'green'
  | 'red'
  | 'yellow'
  | 'gray'
  | 'outline'
  | 'live';

const CLIP = '[clip-path:polygon(10%_0,100%_0,90%_100%,0%_100%)]';

@Component({
  selector: 'ow-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="classes()"><ng-content /></span>`,
  host: { class: 'contents' },
})
export class BadgeComponent {
  readonly variant = input<OwBadgeVariant>('orange');

  private readonly BASE = `inline-block py-[4px] px-[14px] text-[0.72rem] font-extrabold uppercase tracking-[0.1em]`;

  private readonly VARIANTS: Record<OwBadgeVariant, string> = {
    orange: `${CLIP} bg-[#f06314] text-white`,
    blue: `${CLIP} bg-[#00c3ff] text-white`,
    green: `${CLIP} bg-[#34a853] text-white`,
    red: `${CLIP} bg-[#ea4335] text-white`,
    yellow: `${CLIP} bg-[#fbbc04] text-[#202124]`,
    gray: `${CLIP} bg-[#9aa0a6] text-white`,
    outline: 'bg-transparent text-[#f06314] border-[1.5px] border-[#f06314] py-[3px] px-3',
    live: `${CLIP} bg-[#ea4335] text-white animate-pulse`,
  };

  readonly classes = computed(() => `${this.BASE} ${this.VARIANTS[this.variant()]}`);
}
