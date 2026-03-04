import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class ToggleCodeComponent {
  readonly code = `<!-- ow-toggle — suporta [(ngModel)] via CVA e output (changed) -->

<div class="space-y-4 max-w-sm">

  <ow-toggle
    label="Notificações"
    description="Receba alertas de partidas e torneios"
    [(ngModel)]="toggleNotif">
  </ow-toggle>

  <ow-toggle
    label="Transmissão ao Vivo"
    description="Habilitar streaming do seu gameplay"
    [(ngModel)]="toggleStream">
  </ow-toggle>

  <ow-toggle
    label="Sons do Sistema"
    description="Ativar efeitos sonoros na interface"
    [(ngModel)]="toggleSounds">
  </ow-toggle>

  <!-- Toggle desabilitado via wrapper -->
  <div class="opacity-50 cursor-not-allowed pointer-events-none">
    <ow-toggle
      label="Modo Observador"
      description="Disponível apenas para streamers verificados">
    </ow-toggle>
  </div>

</div>`;
}
