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
<div style="background-color: #f06314">...</div>
<!-- var(--ow-orange) -->

<!-- OW Orange Dark -->
<div style="background-color: #d14e0a">...</div>

<!-- OW Blue -->
<div style="background-color: #00c3ff">...</div>

<!-- OW Red -->
<div style="background-color: #ea4335">...</div>

<!-- OW Green -->
<div style="background-color: #34a853">...</div>

<!-- OW Yellow -->
<div style="background-color: #fbbc04">...</div>

<!-- Em classes Tailwind com valores literais -->
<div class="bg-[#f06314] text-white">...</div>
<div class="border-[3px] border-[#f06314]">...</div>`;
}
