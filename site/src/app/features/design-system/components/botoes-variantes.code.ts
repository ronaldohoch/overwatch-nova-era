import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-botoes-variantes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class BotoesVariantesCodeComponent {
  readonly code = `<!-- Variantes de botão -->
<ow-btn variant="primary">Primary</ow-btn>
<ow-btn variant="secondary">Secondary</ow-btn>
<ow-btn variant="blue">Blue</ow-btn>
<ow-btn variant="ghost">Ghost</ow-btn>
<ow-btn variant="danger">Danger</ow-btn>`;
}
