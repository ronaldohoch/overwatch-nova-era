import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

let OW_FAQ_ITEM_UID = 0;

@Component({
  selector: 'faq-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:'./faq-item.component.html',
  host:{
    'class':'widowmaker-bg'
  }
})
export class FaqItemComponent {
  readonly question = input.required<string>();
  readonly answer = input.required<string>();

  /**
   * Se `expanded` vier como `null`, o item se auto-gerencia (modo multi).
   * Se vier `true/false`, o pai controla (modo single).
   */
  readonly expanded = input<boolean | null>(null);
  readonly toggle = output<void>();

  private readonly localExpanded = signal(false);

  readonly isOpen = computed(() => this.expanded() ?? this.localExpanded());

  private readonly uid = `ow-faq-item-${++OW_FAQ_ITEM_UID}`;
  readonly buttonId = `${this.uid}-button`;
  readonly panelId = `${this.uid}-panel`;

  headerClass = computed(() => {
    const base =
      "relative flex justify-between pb-4 pr-5 pt-[10px] uppercase text-(--ow-text) config-bold-d-s xl:text-(--ow-text-muted) " +
      "before:opacity-0 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-ow-primary before:transition-opacity before:content-[''] before:bg-(--ow-orange)";
    return this.isOpen() ? `${base} before:opacity-100` : base;
  });

  questionClass = computed(() => {
    const base =
      'pr-4 transition-transform group-hover:translate-x-4 group-hover:text-(--ow-text) text-lg font-bold pl-4';
    return this.isOpen() ? `${base} translate-x-4 text-(--ow-text)` : base;
  });

  iconClass = computed(() => {
    const base =
      'text-(--ow-text) h-8 w-8 transition min-w-5 flex-none group-hover:scale-125 group-hover:rotate-90';
    // vira “x” quando aberto e evita “pular” no hover
    return this.isOpen() ? `${base} rotate-45 group-hover:rotate-45` : base;
  });

  panelClass = computed(() => {
    const base =
      'grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-[ease]';
    return this.isOpen()
      ? `${base} grid-rows-[1fr] opacity-100`
      : `${base} grid-rows-[0fr] opacity-0 pointer-events-none`;
  });

  onToggle(): void {
    // controlado pelo pai
    if (this.expanded() !== null) {
      this.toggle.emit();
      return;
    }

    // auto-gerenciado
    this.localExpanded.update((v) => !v);
  }
}
