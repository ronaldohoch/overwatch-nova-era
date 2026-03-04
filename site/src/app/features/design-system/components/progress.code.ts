import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class ProgressCodeComponent {
  readonly code = `<!-- ow-progress — color: orange | blue | green -->
<ow-progress
  label="Thunder Hawks"
  [value]="100"
  color="orange"
  [showValue]="true">
</ow-progress>

<ow-progress
  label="Dragon Squad"
  [value]="91"
  color="blue"
  [showValue]="true">
</ow-progress>

<ow-progress
  label="Frost Giants"
  [value]="83"
  color="green"
  [showValue]="true">
</ow-progress>

<!-- value: 0–100 | showValue exibe a % à direita -->`;
}
