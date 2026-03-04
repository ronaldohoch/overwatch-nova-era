import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-radio-horizontal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class RadioHorizontalCodeComponent {
  readonly code = `<!-- Radio group horizontal (pill style) — orientation="horizontal" -->

<ow-radio-group
  groupLabel="Plataforma"
  orientation="horizontal"
  [(ngModel)]="selectedPlatform">
  <ow-radio-item value="pc"      label="PC" />
  <ow-radio-item value="console" label="Console" />
</ow-radio-group>

<!-- orientation: vertical (padrão) | horizontal -->`;
}
