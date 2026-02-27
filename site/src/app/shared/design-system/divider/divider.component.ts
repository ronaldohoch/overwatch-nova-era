import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ow-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <div class="flex items-center gap-4 my-6 text-[#9aa0a6] text-[0.75rem] font-extrabold uppercase tracking-[0.15em]">
        <span class="flex-1 h-px bg-[#e8eaed]"></span>
        <span>{{ label() }}</span>
        <span class="flex-1 h-px bg-[#e8eaed]"></span>
      </div>
    } @else {
      <hr class="h-[2px] border-0 bg-[linear-gradient(90deg,transparent,#f06314,transparent)] my-7" />
    }
  `,
  host: { class: 'block' },
})
export class DividerComponent {
  readonly label = input<string | undefined>(undefined);
}
