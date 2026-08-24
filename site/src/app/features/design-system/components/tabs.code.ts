import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class TabsCodeComponent {
  readonly code = `<!-- ow-tabs com múltiplos ow-tab -->
<ow-tabs>

  <ow-tab label="Visão Geral">
    <div class="pt-6">
      <h4 class="text-[1rem] font-extrabold uppercase text-(--ow-text) mb-3">
        Visão Geral do Torneio
      </h4>
      <p class="text-[0.875rem] text-(--ow-text) leading-[1.6]">
        O Overwatch Nova Era Temporada 2025 reúne os melhores times...
      </p>
    </div>
  </ow-tab>

  <ow-tab label="Estatísticas">
    <!-- Conteúdo da aba -->
  </ow-tab>

  <ow-tab label="Resultados">
    <!-- Conteúdo da aba -->
  </ow-tab>

  <ow-tab label="Agenda">
    <!-- Conteúdo da aba -->
  </ow-tab>

</ow-tabs>`;
}
