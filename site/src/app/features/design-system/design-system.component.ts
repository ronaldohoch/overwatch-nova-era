import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ButtonsComponent } from '../../shared/buttons/buttons';
import { CardComponent } from '../../shared/card/card.component';
import { AlertsComponent } from '../../shared/alerts/alerts.component';
import { TabsComponent, TabsItemComponent } from '../../shared/tabs/tabs.component';

import { BadgeComponent } from '../../shared/design-system/badge/badge.component';
import { TagComponent } from '../../shared/design-system/tag/tag.component';
import { DividerComponent } from '../../shared/design-system/divider/divider.component';
import {
  AvatarComponent,
  AvatarGroupComponent,
  PlayerAvatarComponent,
  RoleBadgeComponent,
} from '../../shared/design-system/avatar/avatar.component';
import { TooltipComponent } from '../../shared/design-system/tooltip/tooltip.component';
import { ToastComponent } from '../../shared/design-system/toast/toast.component';
import { ProgressComponent } from '../../shared/design-system/progress/progress.component';
import { PaginationComponent } from '../../shared/design-system/pagination/pagination.component';
import { StepperComponent, StepComponent } from '../../shared/design-system/stepper/stepper.component';
import { InputComponent } from '../../shared/design-system/input/input.component';
import { TextareaComponent } from '../../shared/design-system/textarea/textarea.component';
import { SelectComponent, type OwSelectOption } from '../../shared/design-system/select/select.component';
import { RadioGroupComponent, RadioItemComponent } from '../../shared/design-system/radio/radio.component';
import { CheckboxComponent } from '../../shared/design-system/checkbox/checkbox.component';
import { ToggleComponent } from '../../shared/design-system/toggle/toggle.component';
import { MatchCardComponent, type OwMatchTeam } from '../../shared/match-card/match-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-design-system',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonsComponent,
    CardComponent,
    AlertsComponent,
    TabsComponent,
    TabsItemComponent,
    BadgeComponent,
    TagComponent,
    DividerComponent,
    AvatarComponent,
    AvatarGroupComponent,
    PlayerAvatarComponent,
    RoleBadgeComponent,
    TooltipComponent,
    ToastComponent,
    ProgressComponent,
    PaginationComponent,
    StepperComponent,
    StepComponent,
    InputComponent,
    TextareaComponent,
    SelectComponent,
    RadioGroupComponent,
    RadioItemComponent,
    CheckboxComponent,
    ToggleComponent,
    MatchCardComponent,
  ],
  templateUrl: './design-system.component.html',
})
export class DesignSystemComponent {
  /* ─── Reactive (signal) — usados em @if/@for ou computados ─── */
  readonly currentPage = signal(1);
  readonly totalPages = signal(8);
  readonly activeStep = signal(2);
  readonly modalOpen = signal(false);
  readonly tags = signal(['DPS', 'Tank', 'Semi-Final', 'Temporada 2025']);

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  removeTag(tag: string): void {
    this.tags.update((t) => t.filter((x) => x !== tag));
  }

  /* ─── Form state — plain properties para [(ngModel)] ─── */
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

  /* ─── Select options ─── */
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

  /* ─── Match cards data ─── */
  readonly matchLive: OwMatchTeam[] = [
    { name: '⚡ Thunder Hawks222', score: 3, winner: true },
    { name: '🔥 Blaze Legion333', score: 1 },
  ];
  readonly matchUpcoming: OwMatchTeam[] = [
    { name: '🐉 Dragon Squad444', score: '-' },
    { name: '❄️ Frost Giants555', score: '-' },
  ];
  readonly matchFinished: OwMatchTeam[] = [
    { name: '🌟 Nova Elite666', score: 3, winner: true },
    { name: '🎯 Precision777', score: 0 },
  ];
}
