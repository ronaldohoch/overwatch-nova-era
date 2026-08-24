import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ow-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <div class="flex items-center gap-4 my-6 text-(--ow-text-subtle) text-[0.75rem] font-extrabold uppercase tracking-[0.15em]">
        <span class="flex-1 h-px bg-(--ow-border)"></span>
        <span>{{ label() }}</span>
        <span class="flex-1 h-px bg-(--ow-border)"></span>
      </div>
    } @else {
      <hr class="h-[2px] border-0 bg-[image:var(--gradient-divider)] my-7" />
    }
  `,
  host: { class: 'block' },
})
export class DividerComponent {
  readonly label = input<string | undefined>(undefined);
}
