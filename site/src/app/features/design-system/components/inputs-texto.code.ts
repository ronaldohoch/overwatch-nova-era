import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-inputs-texto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class InputsTextoCodeComponent {
  readonly code = `<!-- ow-input — state: default | success | error -->
<!-- Suporta [(ngModel)] via CVA -->

<!-- Estado padrão -->
<ow-input
  label="Nome do Time"
  [required]="true"
  placeholder="Ex: Thunder Hawks"
  helperText="Mínimo 3 caracteres."
  [(ngModel)]="inputNome">
</ow-input>

<!-- Estado success -->
<ow-input
  label="Nome do Capitão"
  state="success"
  placeholder="Ex: xShadow"
  helperText="✓ Jogador encontrado"
  [(ngModel)]="inputCapitao">
</ow-input>

<!-- Estado error -->
<ow-input
  label="BattleTag"
  state="error"
  placeholder="Ex: Player#1234"
  helperText="✕ Formato inválido"
  [(ngModel)]="inputBattleTag">
</ow-input>

<!-- Desabilitado via wrapper -->
<div class="opacity-50 pointer-events-none select-none">
  <ow-input label="ID do Torneio" placeholder="Gerado automaticamente" />
</div>`;
}
