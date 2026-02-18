import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

export type OwBtnVariant =
  | 'primary'
  | 'secondary'
  | 'blue'
  | 'primary-mini'
  | 'secondaty-mini'
  | 'secondary-mini'
  | 'blue-mini';
export type OwBtnType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'ow-btn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLink()) {
      <a
        [attr.href]="hrefAttr()"
        [attr.aria-disabled]="disabled()"
        [attr.aria-label]="ariaLabel() ?? null"
        [attr.tabindex]="disabled() ? -1 : 0"
        (click)="onAnchorClick($event)"
        [class]="classes()"
      >
        <ng-content />
      </a>
    } @else {
      <button
        [attr.type]="type()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() ?? null"
        [class]="classes()"
      >
        <ng-content />
      </button>
    }
  `,
})
export class ButtonsComponent {
  /** primary | secondary | blue + versões mini */
  readonly variant = input<OwBtnVariant>('primary');

  /** Se informar href, renderiza <a> (estilizado como botão) */
  readonly href = input<string | undefined>(undefined);

  /** type do <button> */
  readonly type = input<OwBtnType>('button');

  /** disabled para <button> e <a> */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Para acessibilidade quando o conteúdo não descreve bem (ex: só ícone) */
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly isLink = computed(() => !!this.href());

  readonly hrefAttr = computed(() => {
    if (!this.isLink()) return null;
    return this.disabled() ? null : (this.href() ?? null);
  });

  readonly BASE = [
    // layout
    'inline-flex items-center justify-center',
    'py-4 px-10',
    'relative overflow-hidden',
    'border-0 cursor-pointer select-none',
    'no-underline',

    // tipografia
    'text-base font-extrabold uppercase',
    'tracking-[0.15em]',

    // animações
    'transition-all duration-300 ease-in-out',
    'will-change-transform',

    // clip-path do tema
    '[clip-path:polygon(10%_0,100%_0,100%_70%,90%_100%,0_100%,0_30%)]',

    // shine (::before)
    "before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full",
    'before:transition-[left] before:duration-500 before:ease-in-out',
    'before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)]',
    'hover:before:left-[100%]',

    // acessibilidade (foco visível)
    'focus-visible:outline-none',
    'focus-visible:ring-4 focus-visible:ring-[rgba(0,195,255,0.35)]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-white',

    // disabled (button nativo)
    'disabled:opacity-60 disabled:cursor-not-allowed',
  ].join(' ');

  readonly VARIANTS: Record<OwBtnVariant, string> = {
    primary: [
      'bg-[linear-gradient(135deg,#f06314_0%,#d14e0a_100%)]',
      'text-white',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_4px_20px_rgba(240,99,20,0.25)]',
    ].join(' '),

    'primary-mini': [
      'bg-[linear-gradient(135deg,#f06314_0%,#d14e0a_100%)]',
      'text-white',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_4px_20px_rgba(240,99,20,0.25)]',
      '!py-2.5 !px-6 !text-sm !tracking-[0.12em]',
    ].join(' '),

    secondary: [
      'bg-transparent',
      'text-[#202124]',
      'border-2 border-[#f06314]',
      'hover:bg-[#f06314] hover:text-white',
      'hover:-translate-y-0.5',
    ].join(' '),

    'secondary-mini': [
      'bg-transparent',
      'text-[#202124]',
      'border-2 border-[#f06314]',
      'hover:bg-[#f06314] hover:text-white',
      'hover:-translate-y-0.5',
      '!py-2.5 !px-6 !text-sm !tracking-[0.12em]',
    ].join(' '),

    'secondaty-mini': [
      'bg-transparent',
      'text-[#202124]',
      'border-2 border-[#f06314]',
      'hover:bg-[#f06314] hover:text-white',
      'hover:-translate-y-0.5',
      '!py-2.5 !px-6 !text-sm !tracking-[0.12em]',
    ].join(' '),

    blue: [
      'bg-[linear-gradient(135deg,#00c3ff_0%,#0099cc_100%)]',
      'text-white',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_4px_20px_rgba(0,195,255,0.25)]',
    ].join(' '),

    'blue-mini': [
      'bg-[linear-gradient(135deg,#00c3ff_0%,#0099cc_100%)]',
      'text-white',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_4px_20px_rgba(0,195,255,0.25)]',
      '!py-2.5 !px-6 !text-sm !tracking-[0.12em]',
    ].join(' '),
  };

  readonly classes = computed(() => {
    const variant = this.VARIANTS[this.variant()];
    const disabledForAnchor =
      this.isLink() && this.disabled() ? 'pointer-events-none opacity-60' : '';
    return `${this.BASE} ${variant} ${disabledForAnchor}`.trim();
  });

  onAnchorClick(ev: MouseEvent): void {
    if (!this.disabled()) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
  }
}
