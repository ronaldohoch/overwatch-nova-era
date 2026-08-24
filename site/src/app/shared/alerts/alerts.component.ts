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
    info: 'bg-(--ow-alert-info-bg) border-(--ow-blue) text-(--ow-alert-info-text)',
    success: 'bg-(--ow-alert-success-bg) border-(--ow-green) text-(--ow-alert-success-text)',
    warning: 'bg-(--ow-alert-warning-bg) border-(--ow-yellow) text-(--ow-alert-warning-text)',
    error: 'bg-(--ow-alert-error-bg) border-(--ow-red) text-(--ow-alert-error-text)',
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
