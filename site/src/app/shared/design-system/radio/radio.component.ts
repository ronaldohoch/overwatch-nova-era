import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  DestroyRef,
  QueryList,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/* ─── Orientação ─── */
export type OwRadioOrientation = 'vertical' | 'horizontal';
export type OwRadioStyle = 'card' | 'button';

/* ─── Radio Item ─── */
@Component({
  selector: 'ow-radio-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class RadioItemComponent {
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly description = input<string | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
}

/* ─── Radio Group (Card Style) ─── */
@Component({
  selector: 'ow-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full">
      @if (groupLabel()) {
        <div class="block text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-(--ow-text) mb-3">
          {{ groupLabel() }}
        </div>
      }

      @if (radioStyle() === 'button') {
        <!-- Button group style -->
        <div class="flex flex-wrap gap-0" role="radiogroup" [attr.aria-label]="groupLabel() ?? null">
          @for (item of items(); track item.value()) {
            <div class="relative">
              <input
                type="radio"
                [id]="itemId(item.value())"
                [name]="groupName()"
                [value]="item.value()"
                [checked]="item.value() === value()"
                [disabled]="isDisabled() || item.disabled()"
                class="sr-only"
                (change)="onSelect(item.value())"
              />
              <label
                [for]="itemId(item.value())"
                [class]="btnLabelClass(item.value(), item.disabled())"
              >{{ item.label() }}</label>
            </div>
          }
        </div>
      } @else {
        <!-- Card style -->
        <div
          [class]="orientation() === 'horizontal' ? 'flex flex-wrap gap-3' : 'flex flex-col gap-[10px]'"
          role="radiogroup"
          [attr.aria-label]="groupLabel() ?? null"
        >
          @for (item of items(); track item.value()) {
            <label
              [for]="itemId(item.value())"
              [class]="cardItemClass(item.value(), item.disabled())"
            >
              <input
                type="radio"
                [id]="itemId(item.value())"
                [name]="groupName()"
                [value]="item.value()"
                [checked]="item.value() === value()"
                [disabled]="isDisabled() || item.disabled()"
                class="sr-only"
                (change)="onSelect(item.value())"
              />
              <!-- Radio indicator -->
              <div [class]="indicatorClass(item.value())">
                <div [class]="indicatorDotClass(item.value())"></div>
              </div>
              <!-- Text -->
              <div>
                <div class="text-[0.9rem] font-bold text-(--ow-text)">{{ item.label() }}</div>
                @if (item.description()) {
                  <div class="text-[0.75rem] text-(--ow-text-muted) mt-[1px]">{{ item.description() }}</div>
                }
              </div>
            </label>
          }
        </div>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class RadioGroupComponent implements ControlValueAccessor, AfterContentInit {
  @ContentChildren(RadioItemComponent) private readonly projectedItems!: QueryList<RadioItemComponent>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly itemsState = signal<readonly RadioItemComponent[]>([]);

  readonly groupLabel = input<string | undefined>(undefined);
  readonly orientation = input<OwRadioOrientation>('vertical');
  readonly radioStyle = input<OwRadioStyle>('card');

  private static _idCounter = 0;
  private readonly _name = `ow-radio-${++RadioGroupComponent._idCounter}`;

  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);

  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  readonly items = computed(() => this.itemsState());
  readonly groupName = computed(() => this._name);

  ngAfterContentInit(): void {
    this.sync();
    this.projectedItems.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sync());
  }

  private sync(): void {
    this.itemsState.set(this.projectedItems.toArray());
  }

  itemId(val: string): string {
    return `${this._name}-${val}`;
  }

  writeValue(val: string): void {
    this.value.set(val ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onSelect(val: string): void {
    this.value.set(val);
    this._onChange(val);
    this._onTouched();
  }

  /* ─── Card style classes ─── */
  cardItemClass(val: string, itemDisabled: boolean): string {
    const isSelected = val === this.value();
    const base = [
      'flex items-center gap-3 cursor-pointer py-3 px-[18px]',
      'border-2 bg-(--ow-surface) transition-all duration-[250ms]',
      '[clip-path:polygon(3%_0,100%_0,100%_85%,97%_100%,0_100%,0_15%)]',
    ].join(' ');
    const state = isSelected
      ? 'border-(--ow-orange) bg-(--ow-orange-tint)'
      : 'border-(--ow-border) hover:border-(--ow-orange) hover:bg-(--ow-orange-tint)';
    const disabled = itemDisabled || this.isDisabled() ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
    return [base, state, disabled].filter(Boolean).join(' ');
  }

  indicatorClass(val: string): string {
    const isSelected = val === this.value();
    return [
      'w-5 h-5 rounded-full border-2 shrink-0 transition-all duration-[250ms]',
      'flex items-center justify-center',
      isSelected ? 'border-(--ow-orange) bg-(--ow-orange)' : 'border-(--ow-border-strong) bg-(--ow-surface)',
    ].join(' ');
  }

  indicatorDotClass(val: string): string {
    const isSelected = val === this.value();
    return [
      'w-2 h-2 rounded-full bg-(--ow-surface) transition-transform duration-200',
      isSelected ? 'scale-100' : 'scale-0',
    ].join(' ');
  }

  /* ─── Button group style classes ─── */
  btnLabelClass(val: string, itemDisabled: boolean): string {
    const isSelected = val === this.value();
    const base = [
      'inline-flex items-center gap-[7px] py-[10px] px-[22px]',
      'text-[0.82rem] font-extrabold uppercase tracking-[0.1em]',
      'cursor-pointer border-2 transition-all duration-200 -ml-[2px] first:ml-0',
    ].join(' ');
    const state = isSelected
      ? 'bg-(--ow-orange) border-(--ow-orange) text-(--ow-on-accent) z-[2]'
      : 'bg-(--ow-surface) border-(--ow-border) text-(--ow-text-muted) hover:border-(--ow-orange) hover:text-(--ow-orange-text) z-[1]';
    const disabled = itemDisabled || this.isDisabled() ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
    return [base, state, disabled].filter(Boolean).join(' ');
  }
}
