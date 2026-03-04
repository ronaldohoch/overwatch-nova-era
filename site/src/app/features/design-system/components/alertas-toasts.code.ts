import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-alertas-toasts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class AlertasToastsCodeComponent {
  readonly code = `<!-- Toasts — variantes: success | error | warning | info -->
<div class="flex flex-col gap-3 max-w-sm">

  <ow-toast
    variant="success"
    title="Salvo com sucesso!"
    message="As alterações do seu perfil foram salvas."
    [dismissible]="true">
  </ow-toast>

  <ow-toast
    variant="error"
    title="Falha na conexão"
    message="Não foi possível conectar ao servidor."
    [dismissible]="true">
  </ow-toast>

  <ow-toast
    variant="warning"
    title="Sessão expirando"
    message="Sua sessão expira em 5 minutos."
    [dismissible]="true">
  </ow-toast>

  <ow-toast
    variant="info"
    title="Nova partida disponível"
    message="Thunder Hawks vs Dragon Squad em 10 minutos."
    [dismissible]="true">
  </ow-toast>

</div>`;
}
