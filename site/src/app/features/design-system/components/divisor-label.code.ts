import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-divisor-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class DivisorLabelCodeComponent {
  readonly code = `<!-- Divisor com label centralizada -->
<ow-divider label="ou" />
<ow-divider label="fase de grupos" />
<ow-divider label="fim do torneio" />`;
}
