import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-radio-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class RadioButtonCodeComponent {
  readonly code = `<!-- Radio group estilo botão — radioStyle="button" -->

<ow-radio-group
  groupLabel="Fase do Torneio"
  radioStyle="button"
  [(ngModel)]="selectedPhase">
  <ow-radio-item value="grupos"  label="Grupos" />
  <ow-radio-item value="quartas" label="Quartas" />
  <ow-radio-item value="semi"    label="Semi Final" />
  <ow-radio-item value="final"   label="Final" />
</ow-radio-group>

<ow-radio-group
  groupLabel="Status da Partida"
  radioStyle="button"
  [(ngModel)]="selectedStatus">
  <ow-radio-item value="all"      label="Todas" />
  <ow-radio-item value="live"     label="Ao Vivo" />
  <ow-radio-item value="upcoming" label="Em Breve" />
  <ow-radio-item value="finished" label="Finalizadas" />
</ow-radio-group>`;
}
