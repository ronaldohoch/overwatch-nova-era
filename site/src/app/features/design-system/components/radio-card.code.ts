import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-radio-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class RadioCardCodeComponent {
  readonly code = `<!-- Radio group estilo card vertical — radioStyle="card" -->
<!-- Suporta [(ngModel)] via CVA -->

<!-- No componente (.ts) -->
selectedRole = 'tank';

<!-- No template (.html) -->
<ow-radio-group
  groupLabel="Selecione a Função"
  radioStyle="card"
  [(ngModel)]="selectedRole">

  <ow-radio-item
    value="tank"
    label="Tank"
    description="Especialista em absorver dano e proteger aliados.">
  </ow-radio-item>

  <ow-radio-item
    value="dps"
    label="DPS"
    description="Alto dano, alta mobilidade.">
  </ow-radio-item>

  <ow-radio-item
    value="support"
    label="Support"
    description="Mantém o time vivo com cura e buffs.">
  </ow-radio-item>

</ow-radio-group>`;
}
