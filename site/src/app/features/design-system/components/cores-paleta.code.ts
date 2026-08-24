import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-cores-paleta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class CoresPaletaCodeComponent {
  readonly code = `<!-- Paleta Principal — use as CSS custom properties em styles.css -->

<!-- OW Orange -->
<div style="background-color:var(--ow-orange)">...</div>
<!-- var(--ow-orange) -->

<!-- OW Orange Dark -->
<div style="background-color:var(--ow-orange-dark)">...</div>

<!-- OW Blue -->
<div style="background-color:var(--ow-blue)">...</div>

<!-- OW Red -->
<div style="background-color:var(--ow-red)">...</div>

<!-- OW Green -->
<div style="background-color:var(--ow-green)">...</div>

<!-- OW Yellow -->
<div style="background-color:var(--ow-yellow)">...</div>

<!-- Em classes Tailwind com valores literais -->
<div class="bg-(--ow-orange) text-(--ow-on-accent)">...</div>
<div class="border-[3px] border-(--ow-orange)">...</div>`;
}
