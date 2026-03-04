import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-checkbox-inline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class CheckboxInlineCodeComponent {
  readonly code = `<!-- Checkbox inline compacto — [compact]="true" remove o card container -->

<div class="flex flex-wrap gap-6 items-center">
  <ow-checkbox label="Tank"    [compact]="true" [(ngModel)]="checkTank" />
  <ow-checkbox label="DPS"     [compact]="true" [(ngModel)]="checkDps" />
  <ow-checkbox label="Suporte" [compact]="true" [(ngModel)]="checkSupport" />
</div>`;
}
