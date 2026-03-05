import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ButtonsComponent } from '../../../../shared/buttons/buttons';

import { CoresPaletaCodeComponent } from '../cores-paleta.code';
import { CoresCinzasCodeComponent } from '../cores-cinzas.code';

@Component({
  selector: 'ds-foundations-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonsComponent,
    CoresPaletaCodeComponent,
    CoresCinzasCodeComponent,
  ],
  templateUrl: './foundations-section.component.html',
})
export class FoundationsSectionComponent {
  private readonly showCode = signal<Record<string, boolean>>({});

  isCode(key: string): boolean {
    return !!this.showCode()[key];
  }

  toggleCode(key: string): void {
    this.showCode.update((map) => ({ ...map, [key]: !map[key] }));
  }
}
