import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-botoes-tamanhos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class BotoesTabanhosCodeComponent {
  readonly code = `<!-- Tamanhos -->
<ow-btn size="sm">Pequeno</ow-btn>
<ow-btn size="md">Médio</ow-btn>
<ow-btn size="lg">Grande</ow-btn>`;
}
