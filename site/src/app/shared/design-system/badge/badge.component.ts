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
    orange: `${CLIP} bg-(--ow-orange) text-(--ow-on-accent)`,
    blue: `${CLIP} bg-(--ow-blue) text-(--ow-on-accent)`,
    green: `${CLIP} bg-(--ow-green) text-(--ow-on-accent)`,
    red: `${CLIP} bg-(--ow-red) text-(--ow-on-accent)`,
    yellow: `${CLIP} bg-(--ow-yellow) text-(--ow-on-accent-dark)`,
    gray: `${CLIP} bg-(--ow-gray-400) text-(--ow-on-accent)`,
    outline: 'bg-transparent text-(--ow-orange) border-[1.5px] border-(--ow-orange) py-[3px] px-3',
    live: `${CLIP} bg-(--ow-red) text-(--ow-on-accent) animate-pulse`,
  };

  readonly classes = computed(() => `${this.BASE} ${this.VARIANTS[this.variant()]}`);
}
