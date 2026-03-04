import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-alertas-alertas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class AlertasAlertasCodeComponent {
  readonly code = `<!-- Alertas — variantes: info | success | warning | error -->
<app-alerts
  variant="info"
  title="Informação"
  message="O check-in abre em 30 minutos."
  [dismissible]="true">
</app-alerts>

<app-alerts
  variant="success"
  title="Inscrição Confirmada!"
  message="Seu time foi inscrito com sucesso."
  [dismissible]="true">
</app-alerts>

<app-alerts
  variant="warning"
  title="Atenção"
  message="Faltam apenas 2 horas para o check-in."
  [dismissible]="true">
</app-alerts>

<app-alerts
  variant="error"
  title="Erro na Inscrição"
  message="O número máximo de times foi atingido."
  [dismissible]="true">
</app-alerts>`;
}
