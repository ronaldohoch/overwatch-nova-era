import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  signal,
} from '@angular/core';

export type OwAlertVariant = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-alerts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alerts.component.html',
})
export class AlertsComponent {
  readonly variant = input<OwAlertVariant>('info');
  readonly title = input<string | undefined>(undefined);
  readonly message = input<string | undefined>(undefined);
  readonly dismissible = input(true, { transform: booleanAttribute });
  readonly closeAriaLabel = input('Fechar alerta');

  private readonly dismissed = signal(false);

  readonly containerBaseClass = [
    'w-full',
    'py-4 px-5',
    'flex items-start gap-3.5',
    'border-l-4',
    'text-[0.9rem]',
    'mb-3',
  ].join(' ');

  readonly containerVariantClass: Record<OwAlertVariant, string> = {
    info: 'bg-[rgba(0,195,255,0.08)] border-[color:var(--ow-blue)] text-[color:var(--ow-blue-dark)]',
    success: 'bg-[rgba(52,168,83,0.08)] border-[color:var(--ow-green)] text-[#2d7d3a]',
    warning: 'bg-[rgba(251,188,4,0.1)] border-[color:var(--ow-yellow)] text-[#8a6d00]',
    error: 'bg-[rgba(234,67,53,0.08)] border-[color:var(--ow-red)] text-[#c5221f]',
  };

  readonly iconWrapperClass = 'shrink-0 mt-px';
  readonly titleClass = 'font-extrabold uppercase text-[0.8rem] tracking-[0.08em]';
  readonly contentClass = 'min-w-0 flex-1';
  readonly closeButtonClass = [
    'ml-auto cursor-pointer opacity-50 p-0.5',
    'bg-transparent border-0 leading-none',
    'text-[1.1rem]',
    'transition-opacity duration-200 ease-out',
    'hover:opacity-100',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/35',
  ].join(' ');

  readonly defaultTitleByVariant: Record<OwAlertVariant, string> = {
    info: 'Informação',
    success: 'Sucesso',
    warning: 'Atenção',
    error: 'Erro',
  };

  readonly containerClass = computed(() => {
    const variantClass = this.containerVariantClass[this.variant()];
    return `${this.containerBaseClass} ${variantClass}`;
  });

  readonly resolvedTitle = computed(() => {
    const customTitle = this.title()?.trim();
    if (customTitle) return customTitle;
    return this.defaultTitleByVariant[this.variant()];
  });

  readonly hasMessage = computed(() => {
    const value = this.message();
    return typeof value === 'string' && value.trim().length > 0;
  });

  readonly messageText = computed(() => this.message()?.trim() ?? '');
  readonly visible = computed(() => !this.dismissed());

  onClose(): void {
    this.dismissed.set(true);
  }
}
