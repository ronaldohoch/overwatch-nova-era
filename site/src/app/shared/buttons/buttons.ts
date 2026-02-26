import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

export type OwBtnVariant =
  | 'primary'
  | 'secondary'
  | 'blue'
  | 'ghost'
  | 'danger'
  | 'primary-mini'
  | 'secondaty-mini'
  | 'secondary-mini'
  | 'blue-mini'
  | 'ghost-mini'
  | 'danger-mini';

export type OwBtnSize = 'sm' | 'md' | 'lg' | 'icon';
export type OwBtnType = 'button' | 'submit' | 'reset';
export type OwBtnRouterLink = string | readonly (string | number)[];

type OwBtnVisualVariant = 'primary' | 'secondary' | 'blue' | 'ghost' | 'danger';

@Component({
  selector: 'ow-btn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink],
  template: `
    <ng-template #projectedContent>
      <ng-content />
    </ng-template>

    @if (hasRouterLink()) {
      <a
        [routerLink]="routerLinkAttr()"
        [attr.aria-disabled]="disabled()"
        [attr.aria-label]="ariaLabel() ?? null"
        [attr.tabindex]="disabled() ? -1 : 0"
        (click)="onAnchorClick($event)"
        [class]="classes()"
      >
        <ng-container [ngTemplateOutlet]="projectedContent" />
      </a>
    } @else if (hasHref()) {
      <a
        [attr.href]="hrefAttr()"
        [attr.aria-disabled]="disabled()"
        [attr.aria-label]="ariaLabel() ?? null"
        [attr.tabindex]="disabled() ? -1 : 0"
        (click)="onAnchorClick($event)"
        [class]="classes()"
      >
        <ng-container [ngTemplateOutlet]="projectedContent" />
      </a>
    } @else {
      <button
        [attr.type]="type()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() ?? null"
        [class]="classes()"
      >
        <ng-container [ngTemplateOutlet]="projectedContent" />
      </button>
    }
  `,
})
export class ButtonsComponent {
  readonly variant = input<OwBtnVariant>('primary');
  readonly size = input<OwBtnSize>('md');

  readonly routerLink = input<OwBtnRouterLink | undefined>(undefined);
  readonly href = input<string | undefined>(undefined);
  readonly type = input<OwBtnType>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly internalRouterLinkFromHref = computed<OwBtnRouterLink | null>(() => {
    const rawHref = this.href();
    if (typeof rawHref !== 'string') return null;

    const href = rawHref.trim();
    if (!href) return null;

    const isExternalLike = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href);
    if (isExternalLike) return null;
    if (!href.startsWith('/')) return null;

    return href;
  });

  readonly hasRouterLink = computed(() => {
    const explicitLink = this.routerLink();

    if (Array.isArray(explicitLink) && explicitLink.length > 0) return true;
    if (typeof explicitLink === 'string' && explicitLink.trim().length > 0) return true;

    return !!this.internalRouterLinkFromHref();
  });

  readonly hasHref = computed(() => {
    const rawHref = this.href();
    return typeof rawHref === 'string' && rawHref.trim().length > 0;
  });

  readonly isLink = computed(() => this.hasRouterLink() || this.hasHref());

  readonly routerLinkAttr = computed<OwBtnRouterLink | null>(() => {
    if (!this.hasRouterLink()) return null;
    if (this.disabled()) return null;

    const explicitLink = this.routerLink();
    if (Array.isArray(explicitLink) && explicitLink.length > 0) return explicitLink;
    if (typeof explicitLink === 'string' && explicitLink.trim().length > 0) return explicitLink;

    return this.internalRouterLinkFromHref();
  });

  readonly hrefAttr = computed(() => {
    if (!this.hasHref() || this.hasRouterLink()) return null;
    return this.disabled() ? null : (this.href() ?? null);
  });

  private isLegacyMiniVariant(variant: OwBtnVariant): boolean {
    return (
      variant === 'primary-mini' ||
      variant === 'secondary-mini' ||
      variant === 'secondaty-mini' ||
      variant === 'blue-mini' ||
      variant === 'ghost-mini' ||
      variant === 'danger-mini'
    );
  }

  private toVisualVariant(variant: OwBtnVariant): OwBtnVisualVariant {
    switch (variant) {
      case 'primary-mini':
        return 'primary';
      case 'secondary-mini':
      case 'secondaty-mini':
        return 'secondary';
      case 'blue-mini':
        return 'blue';
      case 'ghost-mini':
        return 'ghost';
      case 'danger-mini':
        return 'danger';
      default:
        return variant;
    }
  }

  readonly BASE = [
    'inline-flex items-center justify-center gap-2',
    'relative overflow-hidden',
    'border-0 cursor-pointer select-none',
    'no-underline [font-family:inherit]',
    'font-extrabold uppercase tracking-[0.15em]',
    'transition-all duration-300 ease-in-out',
    'will-change-transform',
    '[clip-path:polygon(10%_0,100%_0,100%_70%,90%_100%,0_100%,0_30%)]',
    "before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full",
    'before:transition-[left] before:duration-500 before:ease-in-out',
    'before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)]',
    'hover:before:left-[100%]',
    'focus-visible:outline-none',
    'focus-visible:ring-4 focus-visible:ring-[rgba(240,99,20,0.35)]',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    'disabled:opacity-[0.45] disabled:cursor-not-allowed disabled:pointer-events-none',
  ].join(' ');

  readonly VARIANTS: Record<OwBtnVisualVariant, string> = {
    primary: [
      'bg-[linear-gradient(135deg,#f06314_0%,#d14e0a_100%)]',
      'text-white',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_4px_20px_rgba(240,99,20,0.35)]',
    ].join(' '),

    secondary: [
      'bg-transparent',
      'text-[#202124]',
      'border-2 border-[#f06314]',
      'hover:bg-[#f06314] hover:text-white',
      'hover:-translate-y-0.5',
    ].join(' '),

    blue: [
      'bg-[linear-gradient(135deg,#00c3ff_0%,#0099cc_100%)]',
      'text-white',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_4px_20px_rgba(0,195,255,0.35)]',
    ].join(' '),

    ghost: [
      'bg-transparent',
      'text-[#5f6368]',
      'border-2 border-[#dadce0]',
      'hover:border-[#5f6368] hover:text-[#202124]',
    ].join(' '),

    danger: [
      'bg-[linear-gradient(135deg,#ea4335_0%,#c5221f_100%)]',
      'text-white',
      'hover:-translate-y-0.5',
      'hover:shadow-[0_4px_20px_rgba(234,67,53,0.35)]',
    ].join(' '),
  };

  readonly SIZES: Record<OwBtnSize, string> = {
    sm: 'py-[9px] px-[22px] text-xs',
    md: 'py-[14px] px-9 text-[0.9rem]',
    lg: 'py-[18px] px-[52px] text-[1.05rem]',
    icon: 'p-3 text-[0.9rem] [clip-path:polygon(20%_0,100%_0,100%_80%,80%_100%,0_100%,0_20%)]',
  };

  readonly resolvedVariant = computed<OwBtnVisualVariant>(() =>
    this.toVisualVariant(this.variant()),
  );

  readonly resolvedSize = computed<OwBtnSize>(() => {
    if (this.isLegacyMiniVariant(this.variant())) return 'sm';
    return this.size();
  });

  readonly classes = computed(() => {
    const variant = this.VARIANTS[this.resolvedVariant()];
    const size = this.SIZES[this.resolvedSize()];
    const disabledForAnchor =
      this.isLink() && this.disabled() ? 'pointer-events-none opacity-[0.45] cursor-not-allowed' : '';

    return `${this.BASE} ${variant} ${size} ${disabledForAnchor}`.trim();
  });

  onAnchorClick(ev: MouseEvent): void {
    if (!this.disabled()) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
  }
}
