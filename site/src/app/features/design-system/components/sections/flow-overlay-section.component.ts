import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { StepperComponent, StepComponent } from '../../../../shared/design-system/stepper/stepper.component';
import { TooltipComponent } from '../../../../shared/design-system/tooltip/tooltip.component';
import { BadgeComponent } from '../../../../shared/design-system/badge/badge.component';

import { StepperCodeComponent } from '../stepper.code';
import { ModalCodeComponent } from '../modal.code';
import { TooltipCodeComponent } from '../tooltip.code';

@Component({
  selector: 'ds-flow-overlay-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonsComponent,
    StepperComponent,
    StepComponent,
    TooltipComponent,
    BadgeComponent,
    StepperCodeComponent,
    ModalCodeComponent,
    TooltipCodeComponent,
  ],
  templateUrl: './flow-overlay-section.component.html',
})
export class FlowOverlaySectionComponent {
  readonly activeStep = signal(2);
  readonly modalOpen = signal(false);

  private readonly showCode = signal<Record<string, boolean>>({});

  isCode(key: string): boolean {
    return !!this.showCode()[key];
  }

  toggleCode(key: string): void {
    this.showCode.update((map) => ({ ...map, [key]: !map[key] }));
  }
}
