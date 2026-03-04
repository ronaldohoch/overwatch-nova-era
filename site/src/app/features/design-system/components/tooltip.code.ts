import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class TooltipCodeComponent {
  readonly code = `<!-- ow-tooltip — wrapper com hover, text é o conteúdo do tooltip -->

<!-- Em torno de um botão -->
<ow-tooltip text="Clique para inscrever seu time no torneio">
  <ow-btn variant="primary">Inscrever Time</ow-btn>
</ow-tooltip>

<!-- Em torno de um badge -->
<ow-tooltip text="Partida ao vivo agora! Assista gratuitamente">
  <ow-badge variant="live">Ao Vivo</ow-badge>
</ow-tooltip>

<!-- Em torno de qualquer elemento -->
<ow-tooltip text="Tank: Especialista em absorver dano e proteger aliados">
  <ow-btn variant="secondary" size="sm">O que é Tank?</ow-btn>
</ow-tooltip>

<!-- O tooltip aparece ao passar o mouse (CSS group-hover/tooltip) -->`;
}
