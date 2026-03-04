import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-teams-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class TeamsPlayerCodeComponent {
  readonly code = `<!-- Player card com ow-player-avatar e ow-role-badge -->

<ow-card [padded]="false" cardClass="max-w-sm">
  <div class="flex items-center gap-4 p-5">

    <ow-player-avatar initials="xS" />

    <div class="flex-1">
      <div class="text-[0.9rem] font-extrabold text-[#111111] mb-0.5">xShadow</div>
      <div class="text-[0.75rem] text-[#5f6368] mb-1">
        Thunder Hawks • BattleTag: xShadow#9823
      </div>
      <ow-role-badge role="damage">DPS</ow-role-badge>
    </div>

    <ow-btn size="sm" variant="ghost">Ver Perfil</ow-btn>

  </div>
</ow-card>`;
}
