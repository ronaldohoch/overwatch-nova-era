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
<div class="bg-(--ow-surface-raised)">Gray 50 — fundo suave</div>
<div class="bg-(--ow-surface-sunken)">Gray 100 — fundo alternado</div>
<div class="bg-(--ow-border)">Gray 200 — bordas leves</div>

<!-- Textos -->
<span class="text-(--ow-text-subtle)">Gray 400 — texto secundário</span>
<span class="text-(--ow-text-muted)">Gray 500 — texto auxiliar</span>
<span class="text-(--ow-text)">Gray 600 — texto corpo</span>
<span class="text-(--ow-text)">Gray 700 — texto forte</span>
<span class="text-(--ow-text)">Gray 900 — texto principal</span>

<!-- Bordas -->
<div class="border border-(--ow-border)">...</div>
<div class="border-b-2 border-(--ow-border-strong)">...</div>`;
}
