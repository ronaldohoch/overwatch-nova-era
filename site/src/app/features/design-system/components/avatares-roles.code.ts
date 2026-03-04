import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-avatares-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class AvataresRolesCodeComponent {
  readonly code = `<!-- Role badges — role: tank | damage | support | flex -->
<ow-role-badge role="tank">Tank</ow-role-badge>
<ow-role-badge role="damage">Damage</ow-role-badge>
<ow-role-badge role="support">Support</ow-role-badge>
<ow-role-badge role="flex">Flex</ow-role-badge>`;
}
