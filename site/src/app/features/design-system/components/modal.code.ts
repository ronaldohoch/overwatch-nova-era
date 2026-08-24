import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class ModalCodeComponent {
  readonly code = `<!-- No componente (.ts) -->
readonly modalOpen = signal(false);

<!-- No template (.html) -->
<ow-btn (click)="modalOpen.set(true)">Abrir Modal</ow-btn>

@if (modalOpen()) {
  <!-- Overlay -->
  <div
    class="fixed inset-0 bg-(--ow-overlay) flex items-center justify-center z-[500]"
    (click)="modalOpen.set(false)">

    <!-- Dialog -->
    <div
      class="bg-(--ow-surface) [clip-path:polygon(5%_0,100%_0,100%_95%,95%_100%,0_100%,0_5%)]
        max-w-lg w-[90%] overflow-hidden [box-shadow:0_24px_64px_rgba(0,0,0,0.25)]"
      (click)="$event.stopPropagation()">

      <!-- Header -->
      <div class="bg-(--ow-surface-raised) border-b-[3px] border-(--ow-orange) px-6 py-5 flex items-center justify-between">
        <span class="text-[1.1rem] font-black uppercase tracking-[0.08em] text-(--ow-text)">
          Confirmar Inscrição
        </span>
        <button type="button" (click)="modalOpen.set(false)">✕</button>
      </div>

      <!-- Body -->
      <div class="px-6 py-7">
        <p class="text-[0.875rem] text-(--ow-text) leading-[1.6]">
          Confirme a inscrição do time <strong>Thunder Hawks</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-(--ow-surface-raised) border-t border-(--ow-border) flex gap-[10px] justify-end">
        <ow-btn variant="ghost" (click)="modalOpen.set(false)">Cancelar</ow-btn>
        <ow-btn variant="primary" (click)="modalOpen.set(false)">Confirmar</ow-btn>
      </div>

    </div>
  </div>
}`;
}
