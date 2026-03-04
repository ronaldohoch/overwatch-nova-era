import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-botoes-estados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class BotoesEstadosCodeComponent {
  readonly code = `<!-- Estado normal -->
<ow-btn variant="primary">Normal</ow-btn>

<!-- Estado desativado -->
<ow-btn variant="primary" [disabled]="true">Desativado</ow-btn>

<!-- Com ícone SVG à esquerda -->
<ow-btn variant="primary">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="mr-2 inline-block">
    <path d="M8 1L10 6H15L11 9.5L12.5 14.5L8 11.5L3.5 14.5L5 9.5L1 6H6L8 1Z" fill="currentColor"/>
  </svg>
  Com Ícone
</ow-btn>

<!-- Icon only — size="icon" -->
<ow-btn variant="secondary" size="icon">
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="2"/>
  </svg>
</ow-btn>

<ow-btn variant="ghost" size="icon">
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 2L11 7H16.5L12 10.5L13.5 16L9 12.5L4.5 16L6 10.5L1.5 7H7L9 2Z" fill="currentColor"/>
  </svg>
</ow-btn>`;
}
