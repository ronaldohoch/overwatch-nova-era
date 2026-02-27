import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface OwSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'ow-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full">
      @if (label()) {
        <label
          [for]="selectId()"
          class="block text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-[#3c4043] mb-[7px]"
        >
          {{ label() }}
          @if (required()) {
            <span class="text-[#f06314] ml-[3px]">*</span>
          }
        </label>
      }

      <div class="relative">
        <select
          [id]="selectId()"
          [disabled]="isDisabled()"
          [attr.aria-required]="required() || null"
          [class]="selectClass()"
          (change)="onChange($event)"
          (blur)="onTouched()"
        >
          @if (placeholder()) {
            <option value="" [selected]="!value()" disabled>{{ placeholder() }}</option>
          }
          @for (opt of options(); track opt.value) {
            <option
              [value]="opt.value"
              [selected]="opt.value === value()"
              [disabled]="opt.disabled ?? false"
            >{{ opt.label }}</option>
          }
          <!-- content projection for plain <option> elements -->
          <ng-content />
        </select>

        <!-- Arrow icon -->
        <span
          class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#f06314]"
          aria-hidden="true"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      @if (helperText()) {
        <p class="text-[0.78rem] mt-[5px] text-[#5f6368]">{{ helperText() }}</p>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class SelectComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly options = input<OwSelectOption[]>([]);
  readonly required = input(false, { transform: booleanAttribute });
  readonly helperText = input<string | undefined>(undefined);

  private static _idCounter = 0;
  private readonly _id = `ow-select-${++SelectComponent._idCounter}`;

  readonly selectId = computed(() => this._id);

  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);

  private _onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value.set(val ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.value.set(val);
    this._onChange(val);
  }

  readonly selectClass = computed(
    () =>
      'w-full py-[13px] pl-[18px] pr-[44px] text-[0.9rem] font-medium text-[#202124] bg-white border-2 border-[#e8eaed] outline-none appearance-none cursor-pointer transition-all duration-[250ms] [clip-path:polygon(4%_0,100%_0,100%_85%,96%_100%,0_100%,0_15%)] focus:border-[#f06314] focus:[box-shadow:0_0_0_3px_rgba(240,99,20,0.12)] disabled:bg-[#f1f3f4] disabled:text-[#9aa0a6] disabled:cursor-not-allowed',
  );
}
