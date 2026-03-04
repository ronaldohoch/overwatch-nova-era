import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-inputs-icone',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class InputsIconeCodeComponent {
  readonly code = `<!-- Input com ícone à esquerda — slot="icon-left" -->
<ow-input
  label="Buscar Time"
  placeholder="Pesquise por nome..."
  [iconLeft]="true">
  <svg slot="icon-left" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
    <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</ow-input>

<!-- Input com ícone à direita — slot="icon-right" -->
<ow-input
  label="Senha"
  type="password"
  placeholder="Digite sua senha"
  [iconRight]="true">
  <svg slot="icon-right" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <ellipse cx="8" cy="8" rx="6" ry="4" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="8" cy="8" r="2" fill="currentColor"/>
  </svg>
</ow-input>`;
}
