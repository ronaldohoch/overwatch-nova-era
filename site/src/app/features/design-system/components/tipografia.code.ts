import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-tipografia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class TipografiaCodeComponent {
  readonly code = `<!-- Display — hero titles -->
<h1 class="text-[3.5rem] font-black uppercase tracking-[0.08em] text-[#111111] leading-none">
  Nova Era
</h1>

<!-- H1 -->
<h1 class="text-[2.5rem] font-black uppercase tracking-[0.06em] text-[#111111] leading-none">
  Overwatch
</h1>

<!-- H2 -->
<h2 class="text-[1.8rem] font-black uppercase tracking-[0.05em] text-[#111111] leading-none">
  Temporada 2025
</h2>

<!-- H3 -->
<h3 class="text-[1.3rem] font-extrabold uppercase tracking-[0.05em] text-[#111111] leading-none">
  Quartas de Final
</h3>

<!-- Body Large -->
<p class="text-[1.05rem] text-[#3c4043] leading-[1.7] max-w-xl">
  A plataforma Overwatch Nova Era conecta jogadores...
</p>

<!-- Body -->
<p class="text-[0.9rem] text-[#3c4043] leading-[1.6]">
  Inscreva seu time, faça o check-in...
</p>

<!-- Caption -->
<span class="text-[0.78rem] text-[#5f6368] uppercase tracking-[0.1em]">
  Temporada 2025 • Fase de Grupos
</span>`;
}
