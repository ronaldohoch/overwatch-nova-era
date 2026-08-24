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
<span class="inline-block bg-[image:var(--gradient-orange)]
  text-(--ow-on-accent) py-[7px] px-[22px] font-extrabold text-[0.78rem] uppercase
  tracking-[0.2em] [clip-path:polygon(10%_0,100%_0,90%_100%,0%_100%)]">
  Campeão
</span>

<!-- MVP (azul) -->
<span class="inline-block bg-[image:var(--gradient-blue)]
  text-(--ow-on-accent) py-[7px] px-[22px] font-extrabold text-[0.78rem] uppercase
  tracking-[0.2em] [clip-path:polygon(10%_0,100%_0,90%_100%,0%_100%)]">
  MVP
</span>

<!-- Top 8 (amarelo) -->
<span class="inline-block bg-[image:var(--gradient-yellow)]
  text-(--ow-text) py-[7px] px-[22px] font-extrabold text-[0.78rem] uppercase
  tracking-[0.2em] [clip-path:polygon(10%_0,100%_0,90%_100%,0%_100%)]">
  Top 8
</span>`;
}
