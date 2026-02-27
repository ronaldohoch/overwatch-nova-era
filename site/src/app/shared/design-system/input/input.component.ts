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

export type OwInputState = 'default' | 'error' | 'success';
export type OwInputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date';

@Component({
  selector: 'ow-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full">
      <!-- Label -->
      @if (label()) {
        <label [for]="inputId()" class="block text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-[#3c4043] mb-[7px]">
          {{ label() }}
          @if (required()) {
            <span class="text-[#f06314] ml-[3px]">*</span>
          }
        </label>
      }

      <!-- Input wrapper -->
      <div class="relative">
        <!-- Icon left -->
        @if (iconLeft()) {
          <span class="absolute left-[14px] top-1/2 -translate-y-1/2 text-[#9aa0a6] pointer-events-none" aria-hidden="true">
            <ng-content select="[slot=icon-left]" />
          </span>
        }

        <input
          [id]="inputId()"
          [type]="type()"
          [value]="value()"
          [placeholder]="placeholder()"
          [disabled]="isDisabled()"
          [attr.aria-required]="required() || null"
          [attr.aria-invalid]="state() === 'error' || null"
          [attr.aria-describedby]="helperText() ? helperId() : null"
          [class]="inputClass()"
          (input)="onInput($event)"
          (blur)="onTouched()"
        />

        <!-- Icon right -->
        @if (iconRight()) {
          <span class="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#9aa0a6] pointer-events-none" aria-hidden="true">
            <ng-content select="[slot=icon-right]" />
          </span>
        }
      </div>

      <!-- Helper text -->
      @if (helperText()) {
        <p [id]="helperId()" [class]="helperClass()">{{ helperText() }}</p>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input('');
  readonly type = input<OwInputType>('text');
  readonly state = input<OwInputState>('default');
  readonly helperText = input<string | undefined>(undefined);
  readonly required = input(false, { transform: booleanAttribute });
  readonly iconLeft = input(false, { transform: booleanAttribute });
  readonly iconRight = input(false, { transform: booleanAttribute });

  private static _idCounter = 0;
  private readonly _id = `ow-input-${++InputComponent._idCounter}`;

  readonly inputId = computed(() => this._id);
  readonly helperId = computed(() => `${this._id}-helper`);

  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);

  private _onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  /* ─── ControlValueAccessor ─── */
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

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this._onChange(val);
  }

  /* ─── Classes ─── */
  private readonly BASE_INPUT = [
    'w-full py-[13px] px-[18px]',
    'text-[0.9rem] font-medium text-[#202124]',
    'bg-white border-2 border-[#e8eaed]',
    'outline-none transition-all duration-[250ms]',
    '[clip-path:polygon(4%_0,100%_0,100%_85%,96%_100%,0_100%,0_15%)]',
    'placeholder:text-[#9aa0a6]',
    'focus:border-[#f06314] focus:[box-shadow:0_0_0_3px_rgba(240,99,20,0.12)]',
    'disabled:bg-[#f1f3f4] disabled:text-[#9aa0a6] disabled:cursor-not-allowed',
  ].join(' ');

  readonly inputClass = computed(() => {
    const stateClass: Record<OwInputState, string> = {
      default: '',
      error: 'border-[#ea4335]',
      success: 'border-[#34a853]',
    };
    const iconLeftPad = this.iconLeft() ? 'pl-[46px]' : '';
    const iconRightPad = this.iconRight() ? 'pr-[46px]' : '';
    return [this.BASE_INPUT, stateClass[this.state()], iconLeftPad, iconRightPad]
      .filter(Boolean)
      .join(' ');
  });

  readonly helperClass = computed(() => {
    const base = 'text-[0.78rem] mt-[5px]';
    const stateColor: Record<OwInputState, string> = {
      default: 'text-[#5f6368]',
      error: 'text-[#ea4335]',
      success: 'text-[#34a853]',
    };
    return `${base} ${stateColor[this.state()]}`;
  });
}
