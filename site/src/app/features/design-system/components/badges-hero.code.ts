import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-badges-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class BadgesHeroCodeComponent {
  readonly code = `<!-- Hero Badge — clip-path angular com gradiente -->

<!-- Campeão (laranja) -->
<span class="inline-block bg-[linear-gradient(135deg,#f06314_0%,#d14e0a_100%)]
  text-white py-[7px] px-[22px] font-extrabold text-[0.78rem] uppercase
  tracking-[0.2em] [clip-path:polygon(10%_0,100%_0,90%_100%,0%_100%)]">
  Campeão
</span>

<!-- MVP (azul) -->
<span class="inline-block bg-[linear-gradient(135deg,#00c3ff_0%,#0099cc_100%)]
  text-white py-[7px] px-[22px] font-extrabold text-[0.78rem] uppercase
  tracking-[0.2em] [clip-path:polygon(10%_0,100%_0,90%_100%,0%_100%)]">
  MVP
</span>

<!-- Top 8 (amarelo) -->
<span class="inline-block bg-[linear-gradient(135deg,#fbbc04_0%,#e8a800_100%)]
  text-[#111111] py-[7px] px-[22px] font-extrabold text-[0.78rem] uppercase
  tracking-[0.2em] [clip-path:polygon(10%_0,100%_0,90%_100%,0%_100%)]">
  Top 8
</span>`;
}
