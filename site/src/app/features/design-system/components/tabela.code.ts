import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-tabela',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class TabelaCodeComponent {
  readonly code = `<!-- Tabela de classificação -->
<div class="bg-white border border-[#e8eaed] overflow-hidden">
  <table class="w-full border-collapse">
    <thead>
      <tr>
        <th class="py-3 px-4 text-left text-[0.72rem] font-extrabold uppercase
          tracking-[0.12em] text-[#5f6368] bg-[#f8f9fa] border-b-2 border-[#f06314]">
          #
        </th>
        <th class="...">Time</th>
        <th class="...">V</th>
        <th class="...">D</th>
        <th class="...">Win Rate</th>
        <th class="...">Status</th>
      </tr>
    </thead>
    <tbody>
      @for (team of teams; track team.id) {
        <tr class="hover:bg-[rgba(240,99,20,0.03)] transition-colors">
          <td class="py-[14px] px-4 text-[0.875rem] border-b border-[#f1f3f4]">
            <span class="text-[#f06314] font-black">{{ team.rank }}</span>
          </td>
          <td class="py-[14px] px-4 border-b border-[#f1f3f4]">
            <div class="flex items-center gap-2">
              <ow-avatar [initials]="team.initials" color="orange" />
              <span class="font-extrabold">{{ team.name }}</span>
            </div>
          </td>
          <td class="py-[14px] px-4 border-b border-[#f1f3f4]">
            <span class="text-[#34a853] font-extrabold">{{ team.wins }}</span>
          </td>
          <td class="...">
            <ow-badge [variant]="team.status === 'Classificado' ? 'green' : 'red'">
              {{ team.status }}
            </ow-badge>
          </td>
        </tr>
      }
    </tbody>
  </table>
</div>`;
}
