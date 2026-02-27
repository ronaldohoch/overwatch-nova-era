import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type OwCheckboxState = 'checked' | 'unchecked' | 'indeterminate';

/* ─── Checkbox Individual ─── */
@Component({
  selector: 'ow-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <label [for]="checkId()" [class]="containerClass()">
      <input
        type="checkbox"
        [id]="checkId()"
        [checked]="isChecked()"
        [indeterminate]="checkState() === 'indeterminate'"
        [disabled]="isDisabled()"
        class="sr-only"
        [attr.aria-checked]="checkState() === 'indeterminate' ? 'mixed' : isChecked()"
        (change)="onToggle($event)"
      />

      <!-- Indicator box -->
      <div [class]="indicatorClass()">
        @if (checkState() === 'indeterminate') {
          <svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24" stroke-width="3">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        } @else {
          <svg
            width="12"
            height="12"
            fill="none"
            stroke="white"
            viewBox="0 0 24 24"
            stroke-width="3"
            [class]="checkState() === 'checked' ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.6]'"
            class="transition-all duration-200"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        }
      </div>

      <!-- Text -->
      @if (label() || description()) {
        <div>
          @if (label()) {
            <div class="text-[0.9rem] font-bold text-[#202124]">{{ label() }}</div>
          }
          @if (description()) {
            <div class="text-[0.75rem] text-[#5f6368] mt-[1px]">{{ description() }}</div>
          }
        </div>
      } @else {
        <ng-content />
      }
    </label>
  `,
  host: { class: 'contents' },
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Layout inline compacto (sem clip-path) */
  readonly compact = input(false, { transform: booleanAttribute });
  readonly changed = output<boolean>();

  private static _idCounter = 0;
  private readonly _id = `ow-checkbox-${++CheckboxComponent._idCounter}`;

  readonly checkId = computed(() => this._id);

  protected readonly checked = signal(false);
  protected readonly isDisabled = signal(false);

  readonly checkState = computed<OwCheckboxState>(() => {
    if (this.indeterminate()) return 'indeterminate';
    return this.checked() ? 'checked' : 'unchecked';
  });

  readonly isChecked = computed(() => this.checked());

  private _onChange: (v: boolean) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: boolean): void {
    this.checked.set(!!val);
  }
  registerOnChange(fn: (v: boolean) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onToggle(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;
    this.checked.set(next);
    this._onChange(next);
    this._onTouched();
    this.changed.emit(next);
  }

  readonly containerClass = computed(() => {
    const isActive = this.checkState() !== 'unchecked';
    const compact = this.compact();
    const disabled = this.isDisabled();

    const base = compact
      ? 'flex items-center gap-3 cursor-pointer py-[10px] px-4 border-2 bg-white transition-all duration-[250ms]'
      : 'flex items-start gap-3 cursor-pointer py-3 px-[18px] border-2 bg-white transition-all duration-[250ms] [clip-path:polygon(3%_0,100%_0,100%_85%,97%_100%,0_100%,0_15%)]';

    const state = isActive
      ? 'border-[#f06314] bg-[rgba(240,99,20,0.06)]'
      : 'border-[#e8eaed] hover:border-[#f06314] hover:bg-[rgba(240,99,20,0.04)]';

    const dis = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

    return [base, state, dis].filter(Boolean).join(' ');
  });

  readonly indicatorClass = computed(() => {
    const isActive = this.checkState() !== 'unchecked';
    const base =
      'w-5 h-5 shrink-0 mt-[1px] border-2 transition-all duration-[250ms] flex items-center justify-center [clip-path:polygon(10%_0,100%_0,100%_90%,90%_100%,0_100%,0_10%)]';
    return isActive ? `${base} bg-[#f06314] border-[#f06314]` : `${base} bg-white border-[#dadce0]`;
  });
}
