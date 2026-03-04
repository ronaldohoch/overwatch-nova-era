import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-checkbox-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class CheckboxCardCodeComponent {
  readonly code = `<!-- ow-checkbox — card style (padrão) com description -->
<!-- Suporta [(ngModel)] via CVA e [indeterminate] -->

<div class="space-y-3 max-w-sm">

  <ow-checkbox
    label="King's Row"
    description="Payload map — London, United Kingdom"
    [(ngModel)]="checkKingsRow">
  </ow-checkbox>

  <ow-checkbox
    label="Hanamura"
    description="Assault map — Japan"
    [(ngModel)]="checkHanamura">
  </ow-checkbox>

  <ow-checkbox
    label="Ilios"
    description="Control map — Greece"
    [(ngModel)]="checkIlios">
  </ow-checkbox>

  <!-- Estado indeterminate -->
  <ow-checkbox
    label="Eichenwalde"
    description="Hybrid map — Germany"
    [indeterminate]="true">
  </ow-checkbox>

</div>`;
}
