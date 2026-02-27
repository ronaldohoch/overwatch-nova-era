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

@Component({
  selector: 'ow-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true,
    },
  ],
  template: `
    <label [for]="toggleId()" [class]="containerClass()">
      <input
        type="checkbox"
        [id]="toggleId()"
        [checked]="checked()"
        [disabled]="isDisabled()"
        class="sr-only"
        [attr.role]="'switch'"
        [attr.aria-checked]="checked()"
        (change)="onToggle($event)"
      />

      <!-- Label + Description -->
      <div class="flex-1 min-w-0">
        @if (label()) {
          <div class="text-[0.9rem] font-bold text-[#202124]">{{ label() }}</div>
        }
        @if (description()) {
          <div class="text-[0.75rem] text-[#5f6368]">{{ description() }}</div>
        }
        <ng-content />
      </div>

      <!-- Toggle track -->
      <div [class]="trackClass()">
        <div [class]="thumbClass()"></div>
      </div>
    </label>
  `,
  host: { class: 'block' },
})
export class ToggleComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly description = input<string | undefined>(undefined);
  readonly changed = output<boolean>();

  private static _idCounter = 0;
  private readonly _id = `ow-toggle-${++ToggleComponent._idCounter}`;

  readonly toggleId = computed(() => this._id);

  protected readonly checked = signal(false);
  protected readonly isDisabled = signal(false);

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
    const isOn = this.checked();
    const disabled = this.isDisabled();
    const base = [
      'flex items-center justify-between gap-4',
      'py-[14px] px-[18px]',
      'border-2 bg-white cursor-pointer',
      'transition-all duration-[250ms]',
    ].join(' ');
    const state = isOn ? 'border-[rgba(240,99,20,0.3)]' : 'border-[#e8eaed] hover:border-[#dadce0]';
    const dis = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
    return [base, state, dis].filter(Boolean).join(' ');
  });

  readonly trackClass = computed(() => {
    const isOn = this.checked();
    return [
      'w-12 h-[26px] rounded-[999px] relative shrink-0 transition-colors duration-[250ms]',
      isOn ? 'bg-[#f06314]' : 'bg-[#e8eaed]',
    ].join(' ');
  });

  readonly thumbClass = computed(() => {
    const isOn = this.checked();
    return [
      'absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white',
      '[box-shadow:0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-[250ms]',
      isOn ? 'translate-x-[22px]' : 'translate-x-0',
    ].join(' ');
  });
}
