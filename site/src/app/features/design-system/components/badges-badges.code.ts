import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-badges-badges',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class BadgesBadgesCodeComponent {
  readonly code = `<!-- Variantes de ow-badge -->
<ow-badge variant="orange">Orange</ow-badge>
<ow-badge variant="blue">Blue</ow-badge>
<ow-badge variant="green">Green</ow-badge>
<ow-badge variant="red">Red</ow-badge>
<ow-badge variant="yellow">Yellow</ow-badge>
<ow-badge variant="gray">Gray</ow-badge>
<ow-badge variant="outline">Outline</ow-badge>
<ow-badge variant="live">🔴 Ao Vivo</ow-badge>`;
}
