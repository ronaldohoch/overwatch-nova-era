import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-cores-cinzas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class CoresCinzasCodeComponent {
  readonly code = `<!-- Escala de Cinzas -->

<!-- Backgrounds -->
<div class="bg-[#f8f9fa]">Gray 50 — fundo suave</div>
<div class="bg-[#f1f3f4]">Gray 100 — fundo alternado</div>
<div class="bg-[#e8eaed]">Gray 200 — bordas leves</div>

<!-- Textos -->
<span class="text-[#9aa0a6]">Gray 400 — texto secundário</span>
<span class="text-[#5f6368]">Gray 500 — texto auxiliar</span>
<span class="text-[#3c4043]">Gray 600 — texto corpo</span>
<span class="text-[#202124]">Gray 700 — texto forte</span>
<span class="text-[#111111]">Gray 900 — texto principal</span>

<!-- Bordas -->
<div class="border border-[#e8eaed]">...</div>
<div class="border-b-2 border-[#dadce0]">...</div>`;
}
