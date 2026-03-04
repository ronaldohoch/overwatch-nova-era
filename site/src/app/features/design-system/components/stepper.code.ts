import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class StepperCodeComponent {
  readonly code = `<!-- No componente (.ts) -->
readonly activeStep = signal(2);

<!-- No template (.html) -->
<ow-stepper [activeStep]="activeStep()">

  <ow-step label="Inscrição">
    <p class="text-[0.875rem] text-[#3c4043] leading-[1.6]">
      Preencha os dados do seu time e inscreva-se no torneio.
    </p>
  </ow-step>

  <ow-step label="Aprovação">
    <p>Aguarde a aprovação pelos organizadores.</p>
  </ow-step>

  <ow-step label="Check-in">
    <p>Faça o check-in antes do horário limite.</p>
  </ow-step>

  <ow-step label="Competir">
    <p>Boa sorte! Que vença o melhor time!</p>
  </ow-step>

</ow-stepper>

<!-- Navegação entre steps -->
<div class="flex gap-3 mt-8">
  <ow-btn size="sm" variant="ghost" (click)="activeStep.set(activeStep() - 1)">
    Anterior
  </ow-btn>
  <ow-btn size="sm" (click)="activeStep.set(activeStep() + 1)">
    Próximo
  </ow-btn>
</div>

<!-- activeStep: índice base 1 | estados automáticos: done / active / pending -->`;
}
