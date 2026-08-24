import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type OwTagVariant = 'default' | 'orange';

@Component({
  selector: 'ow-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="containerClass()">
      <ng-content />
      @if (removable()) {
        <button
          type="button"
          class="cursor-pointer opacity-50 text-[0.9rem] leading-none transition-opacity duration-200 bg-transparent border-0 p-0 hover:opacity-100 focus-visible:outline-none"
          aria-label="Remover tag"
          (click)="removed.emit()"
        >×</button>
      }
    </span>
  `,
  host: { class: 'contents' },
})
export class TagComponent {
  readonly variant = input<OwTagVariant>('default');
  readonly removable = input(true);
  readonly removed = output<void>();

  private readonly VARIANTS: Record<OwTagVariant, string> = {
    default: 'border-(--ow-border) bg-(--ow-surface-raised) text-(--ow-text)',
    orange: 'border-(--ow-orange) bg-(--ow-orange-tint-strong) text-(--ow-orange)',
  };

  readonly containerClass = computed(
    () =>
      `inline-flex items-center gap-[6px] py-[5px] px-[14px] text-[0.78rem] font-bold rounded-[2px] border ${this.VARIANTS[this.variant()]}`,
  );
}
