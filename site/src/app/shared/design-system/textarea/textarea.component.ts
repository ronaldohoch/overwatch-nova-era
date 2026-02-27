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

export type OwTextareaState = 'default' | 'error' | 'success';

@Component({
  selector: 'ow-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full">
      @if (label()) {
        <label
          [for]="textareaId()"
          class="block text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-[#3c4043] mb-[7px]"
        >
          {{ label() }}
          @if (required()) {
            <span class="text-[#f06314] ml-[3px]">*</span>
          }
        </label>
      }

      <textarea
        [id]="textareaId()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [rows]="rows()"
        [attr.aria-required]="required() || null"
        [attr.aria-invalid]="state() === 'error' || null"
        [attr.aria-describedby]="helperText() ? helperId() : null"
        [class]="textareaClass()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      ></textarea>

      @if (helperText()) {
        <p [id]="helperId()" [class]="helperClass()">{{ helperText() }}</p>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class TextareaComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input('');
  readonly state = input<OwTextareaState>('default');
  readonly helperText = input<string | undefined>(undefined);
  readonly required = input(false, { transform: booleanAttribute });
  readonly rows = input(4);

  private static _idCounter = 0;
  private readonly _id = `ow-textarea-${++TextareaComponent._idCounter}`;

  readonly textareaId = computed(() => this._id);
  readonly helperId = computed(() => `${this._id}-helper`);

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

  onInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.value.set(val);
    this._onChange(val);
  }

  private readonly BASE =
    'w-full py-[13px] px-[18px] text-[0.9rem] font-medium text-[#202124] bg-white border-2 border-[#e8eaed] outline-none resize-y min-h-[100px] transition-all duration-[250ms] placeholder:text-[#9aa0a6] focus:border-[#f06314] focus:[box-shadow:0_0_0_3px_rgba(240,99,20,0.12)] disabled:bg-[#f1f3f4] disabled:text-[#9aa0a6] disabled:cursor-not-allowed';

  readonly textareaClass = computed(() => {
    const stateClass: Record<OwTextareaState, string> = {
      default: '',
      error: 'border-[#ea4335]',
      success: 'border-[#34a853]',
    };
    return `${this.BASE} ${stateClass[this.state()]}`;
  });

  readonly helperClass = computed(() => {
    const stateColor: Record<OwTextareaState, string> = {
      default: 'text-[#5f6368]',
      error: 'text-[#ea4335]',
      success: 'text-[#34a853]',
    };
    return `text-[0.78rem] mt-[5px] ${stateColor[this.state()]}`;
  });
}
