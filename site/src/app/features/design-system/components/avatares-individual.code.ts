import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-avatares-individual',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class AvataresIndividualCodeComponent {
  readonly code = `<!-- Avatar de jogador com role badge -->
<div class="flex items-center gap-4">

  <ow-player-avatar initials="TH" />

  <div>
    <div class="text-[0.9rem] font-extrabold text-[#111111]">xShadow</div>
    <div class="text-[0.75rem] text-[#5f6368] mb-1">Thunder Hawks</div>
    <ow-role-badge role="damage">DPS</ow-role-badge>
  </div>

</div>

<!-- ow-player-avatar: avatar grande com clip-path hexagonal -->
<!-- ow-role-badge: role — tank | damage | support | flex -->`;
}
