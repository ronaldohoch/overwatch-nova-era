import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-cards-base',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class CardsBaseCodeComponent {
  readonly code = `<!-- Card base com header / body / footer -->
<ow-card [padded]="false" cardClass="max-w-sm">

  <!-- Header -->
  <div class="bg-[#f8f9fa] px-6 py-[18px] border-b-2 border-[#f06314]">
    <div class="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-[#5f6368] mb-1">
      Torneio
    </div>
    <div class="text-[1.05rem] font-black uppercase tracking-[0.05em] text-[#111111]">
      Thunder Hawks vs Dragon Squad
    </div>
  </div>

  <!-- Body -->
  <div class="p-6">
    <p class="text-[0.875rem] text-[#3c4043] leading-[1.6] mb-4">
      Partida de Quartas de Final da Temporada 2025.
    </p>
    <div class="flex items-center gap-2">
      <ow-badge variant="live">Ao Vivo</ow-badge>
      <ow-badge variant="orange">Quartas</ow-badge>
    </div>
  </div>

  <!-- Footer -->
  <div class="px-6 py-[14px] bg-[#f8f9fa] border-t border-[#e8eaed] flex justify-end gap-2">
    <ow-btn size="sm" variant="ghost">Detalhes</ow-btn>
    <ow-btn size="sm" variant="primary">Assistir</ow-btn>
  </div>

</ow-card>`;
}
