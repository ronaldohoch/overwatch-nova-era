import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-teams-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class TeamsCardsCodeComponent {
  readonly code = `<!-- Cards de time com clip-path e role badges -->

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

  <ow-card cardClass="text-center" contentClass="flex flex-col items-center gap-2 p-6">

    <!-- Logo com clip-path hexagonal -->
    <div class="w-[72px] h-[72px] bg-[#f1f3f4]
      [clip-path:polygon(20%_0,100%_0,100%_80%,80%_100%,0_100%,0_20%)]
      flex items-center justify-center text-[1.8rem] font-black text-[#f06314] mx-auto mb-4">
      TH
    </div>

    <div class="text-[1rem] font-black uppercase tracking-[0.06em] text-[#111111]">
      Thunder Hawks
    </div>
    <div class="text-[0.75rem] text-[#5f6368] uppercase tracking-[0.08em]">
      São Paulo, SP
    </div>

    <div class="flex gap-2 mt-2">
      <ow-role-badge role="tank">Tank</ow-role-badge>
      <ow-role-badge role="damage">DPS</ow-role-badge>
      <ow-role-badge role="support">Support</ow-role-badge>
    </div>

  </ow-card>

</div>`;
}
