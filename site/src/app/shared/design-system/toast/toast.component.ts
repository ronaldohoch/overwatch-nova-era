import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

export type OwToastVariant = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'ow-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div
        [class]="containerClass()"
        role="status"
        [attr.aria-live]="variant() === 'error' ? 'assertive' : 'polite'"
      >
        <!-- Icon -->
        <span class="shrink-0" [class]="iconColorClass()" aria-hidden="true">
          @switch (variant()) {
            @case ('success') {
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
            @case ('error') {
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            }
            @case ('warning') {
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            }
            @default {
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            }
          }
        </span>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          @if (title()) {
            <div class="font-extrabold text-[0.8rem] uppercase tracking-[0.08em]">{{ title() }}</div>
          }
          @if (message()) {
            <div class="text-[0.78rem] opacity-75">{{ message() }}</div>
          } @else {
            <ng-content />
          }
        </div>

        <!-- Close -->
        @if (dismissible()) {
          <button
            type="button"
            class="cursor-pointer opacity-40 bg-transparent border-0 text-white leading-none text-[1.1rem] p-0 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-none"
            aria-label="Fechar"
            (click)="onClose()"
          >×</button>
        }
      </div>
    }
  `,
  host: { class: 'contents' },
})
export class ToastComponent {
  readonly variant = input<OwToastVariant>('info');
  readonly title = input<string | undefined>(undefined);
  readonly message = input<string | undefined>(undefined);
  readonly dismissible = input(true, { transform: booleanAttribute });
  readonly closed = output<void>();

  private readonly dismissed = signal(false);
  readonly visible = computed(() => !this.dismissed());

  private readonly ICON_COLORS: Record<OwToastVariant, string> = {
    success: 'text-[#34a853]',
    error: 'text-[#ea4335]',
    warning: 'text-[#fbbc04]',
    info: 'text-[#00c3ff]',
  };

  readonly iconColorClass = computed(() => this.ICON_COLORS[this.variant()]);

  readonly containerClass = computed(
    () =>
      'inline-flex items-center gap-3 py-[14px] px-5 bg-[#202124] text-white text-[0.875rem] font-semibold [box-shadow:0_8px_32px_rgba(0,0,0,0.25)] min-w-[280px] [clip-path:polygon(4%_0,100%_0,100%_85%,96%_100%,0_100%,0_15%)]',
  );

  onClose(): void {
    this.dismissed.set(true);
    this.closed.emit();
  }
}
