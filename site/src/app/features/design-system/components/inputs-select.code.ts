import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-inputs-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class InputsSelectCodeComponent {
  readonly code = `<!-- No componente (.ts) -->
readonly regiaoOptions: OwSelectOption[] = [
  { value: 'sul',       label: 'Sul' },
  { value: 'sudeste',   label: 'Sudeste' },
  { value: 'nordeste',  label: 'Nordeste' },
];
selectedRegiao = 'sudeste';

<!-- No template (.html) -->
<ow-select
  label="Região"
  placeholder="Selecione sua região"
  [options]="regiaoOptions"
  helperText="Selecione a região do seu time."
  [(ngModel)]="selectedRegiao">
</ow-select>

<!-- Ou com <option> nativos projetados via ng-content -->
<ow-select label="Fase">
  <option value="grupos">Grupos</option>
  <option value="quartas">Quartas de Final</option>
  <option value="semi">Semi Final</option>
  <option value="final">Final</option>
</ow-select>`;
}
