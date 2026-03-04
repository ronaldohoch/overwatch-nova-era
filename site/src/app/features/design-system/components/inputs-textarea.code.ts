import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-inputs-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class InputsTextareaCodeComponent {
  readonly code = `<!-- ow-textarea — suporta [(ngModel)] via CVA -->
<!-- Mesmas propriedades de ow-input: label, state, helperText -->

<ow-textarea
  label="Descrição do Time"
  placeholder="Descreva sua equipe, estilo de jogo, conquistas..."
  helperText="Máximo 280 caracteres."
  [(ngModel)]="inputTextarea">
</ow-textarea>

<!-- Com estado de erro -->
<ow-textarea
  label="Bio"
  state="error"
  helperText="✕ Texto muito longo">
</ow-textarea>`;
}
