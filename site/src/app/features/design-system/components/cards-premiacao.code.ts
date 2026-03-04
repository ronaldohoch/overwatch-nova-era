import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-cards-premiacao',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class CardsPremiacaoCodeComponent {
  readonly code = `<!-- Cards de premiação em grid -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

  <!-- 1º Lugar -->
  <ow-card cardClass="text-center" contentClass="flex flex-col items-center">
    <div class="text-[3rem] mb-2">🥇</div>
    <div class="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-[#f06314] mb-1">1º Lugar</div>
    <div class="text-[1.5rem] font-black text-[#111111] mb-2">R$ 5.000</div>
    <p class="text-[0.8rem] text-[#5f6368]">+ Trophy + Medal</p>
  </ow-card>

  <!-- 2º Lugar -->
  <ow-card cardClass="text-center" contentClass="flex flex-col items-center">
    <div class="text-[3rem] mb-2">🥈</div>
    <div class="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-[#5f6368] mb-1">2º Lugar</div>
    <div class="text-[1.5rem] font-black text-[#111111] mb-2">R$ 2.500</div>
  </ow-card>

  <!-- 3º Lugar -->
  <ow-card cardClass="text-center" contentClass="flex flex-col items-center">
    <div class="text-[3rem] mb-2">🥉</div>
    <div class="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-[#5f6368] mb-1">3º Lugar</div>
    <div class="text-[1.5rem] font-black text-[#111111] mb-2">R$ 1.000</div>
  </ow-card>

</div>`;
}
