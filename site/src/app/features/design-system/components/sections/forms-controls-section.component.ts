import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { InputComponent } from '../../../../shared/design-system/input/input.component';
import { TextareaComponent } from '../../../../shared/design-system/textarea/textarea.component';
import { SelectComponent, type OwSelectOption } from '../../../../shared/design-system/select/select.component';
import { RadioGroupComponent, RadioItemComponent } from '../../../../shared/design-system/radio/radio.component';
import { CheckboxComponent } from '../../../../shared/design-system/checkbox/checkbox.component';
import { ToggleComponent } from '../../../../shared/design-system/toggle/toggle.component';

import { InputsTextoCodeComponent } from '../inputs-texto.code';
import { InputsIconeCodeComponent } from '../inputs-icone.code';
import { InputsSelectCodeComponent } from '../inputs-select.code';
import { InputsTextareaCodeComponent } from '../inputs-textarea.code';
import { RadioCardCodeComponent } from '../radio-card.code';
import { RadioButtonCodeComponent } from '../radio-button.code';
import { RadioHorizontalCodeComponent } from '../radio-horizontal.code';
import { CheckboxCardCodeComponent } from '../checkbox-card.code';
import { CheckboxInlineCodeComponent } from '../checkbox-inline.code';
import { ToggleCodeComponent } from '../toggle.code';

@Component({
  selector: 'ds-forms-controls-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonsComponent,
    InputComponent,
    TextareaComponent,
    SelectComponent,
    RadioGroupComponent,
    RadioItemComponent,
    CheckboxComponent,
    ToggleComponent,
    InputsTextoCodeComponent,
    InputsIconeCodeComponent,
    InputsSelectCodeComponent,
    InputsTextareaCodeComponent,
    RadioCardCodeComponent,
    RadioButtonCodeComponent,
    RadioHorizontalCodeComponent,
    CheckboxCardCodeComponent,
    CheckboxInlineCodeComponent,
    ToggleCodeComponent,
  ],
  templateUrl: './forms-controls-section.component.html',
})
export class FormsControlsSectionComponent {
  selectedRole = 'tank';
  selectedPhase = 'quartas';
  selectedStatus = 'all';
  selectedPlatform = 'pc';

  checkKingsRow = true;
  checkHanamura = true;
  checkIlios = false;

  checkTank = true;
  checkDps = true;
  checkSupport = false;

  toggleNotif = true;
  toggleStream = false;
  toggleSounds = true;

  inputNome = '';
  inputCapitao = 'xShadow';
  inputBattleTag = 'invalid';
  inputTextarea = '';

  selectedRegiao = 'sudeste';
  selectedFase = 'quartas';

  readonly regiaoOptions: OwSelectOption[] = [
    { value: 'sul', label: 'Sul' },
    { value: 'sudeste', label: 'Sudeste' },
    { value: 'nordeste', label: 'Nordeste' },
    { value: 'norte', label: 'Norte' },
    { value: 'centro-oeste', label: 'Centro-Oeste' },
  ];

  readonly faseOptions: OwSelectOption[] = [
    { value: 'todas', label: 'Todas as fases' },
    { value: 'quartas', label: 'Quartas de Final' },
    { value: 'semi', label: 'Semi Final' },
    { value: 'final', label: 'Final' },
  ];

  private readonly showCode = signal<Record<string, boolean>>({});

  isCode(key: string): boolean {
    return !!this.showCode()[key];
  }

  toggleCode(key: string): void {
    this.showCode.update((map) => ({ ...map, [key]: !map[key] }));
  }
}
