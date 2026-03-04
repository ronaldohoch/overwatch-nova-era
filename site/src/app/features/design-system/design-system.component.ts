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

// ── Code snippet components (loaded via @defer) ──────────────────────────────
import { CoresPaletaCodeComponent } from './components/cores-paleta.code';
import { CoresCinzasCodeComponent } from './components/cores-cinzas.code';
import { TipografiaCodeComponent } from './components/tipografia.code';
import { BotoesVariantesCodeComponent } from './components/botoes-variantes.code';
import { BotoesTabanhosCodeComponent } from './components/botoes-tamanhos.code';
import { BotoesEstadosCodeComponent } from './components/botoes-estados.code';
import { BadgesBadgesCodeComponent } from './components/badges-badges.code';
import { BadgesTagsCodeComponent } from './components/badges-tags.code';
import { BadgesHeroCodeComponent } from './components/badges-hero.code';
import { DivisorPadraoCodeComponent } from './components/divisor-padrao.code';
import { DivisorLabelCodeComponent } from './components/divisor-label.code';
import { CardsBaseCodeComponent } from './components/cards-base.code';
import { CardsPremiacaoCodeComponent } from './components/cards-premiacao.code';
import { AlertasAlertasCodeComponent } from './components/alertas-alertas.code';
import { AlertasToastsCodeComponent } from './components/alertas-toasts.code';
import { TabsCodeComponent } from './components/tabs.code';
import { ProgressCodeComponent } from './components/progress.code';
import { TabelaCodeComponent } from './components/tabela.code';
import { PaginacaoCodeComponent } from './components/paginacao.code';
import { AvataresGrupoCodeComponent } from './components/avatares-grupo.code';
import { AvataresIndividualCodeComponent } from './components/avatares-individual.code';
import { AvataresRolesCodeComponent } from './components/avatares-roles.code';
import { StepperCodeComponent } from './components/stepper.code';
import { ModalCodeComponent } from './components/modal.code';
import { TooltipCodeComponent } from './components/tooltip.code';
import { InputsTextoCodeComponent } from './components/inputs-texto.code';
import { InputsIconeCodeComponent } from './components/inputs-icone.code';
import { InputsSelectCodeComponent } from './components/inputs-select.code';
import { InputsTextareaCodeComponent } from './components/inputs-textarea.code';
import { RadioCardCodeComponent } from './components/radio-card.code';
import { RadioButtonCodeComponent } from './components/radio-button.code';
import { RadioHorizontalCodeComponent } from './components/radio-horizontal.code';
import { CheckboxCardCodeComponent } from './components/checkbox-card.code';
import { CheckboxInlineCodeComponent } from './components/checkbox-inline.code';
import { ToggleCodeComponent } from './components/toggle.code';
import { MatchCardCodeComponent } from './components/match-card.code';
import { TeamsCardsCodeComponent } from './components/teams-cards.code';
import { TeamsPlayerCodeComponent } from './components/teams-player.code';
import { DsCodeBlockComponent } from "./components/ds-code-block/ds-code-block.component";

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
    // Code snippet components
    CoresPaletaCodeComponent,
    CoresCinzasCodeComponent,
    TipografiaCodeComponent,
    BotoesVariantesCodeComponent,
    BotoesTabanhosCodeComponent,
    BotoesEstadosCodeComponent,
    BadgesBadgesCodeComponent,
    BadgesTagsCodeComponent,
    BadgesHeroCodeComponent,
    DivisorPadraoCodeComponent,
    DivisorLabelCodeComponent,
    CardsBaseCodeComponent,
    CardsPremiacaoCodeComponent,
    AlertasAlertasCodeComponent,
    AlertasToastsCodeComponent,
    TabsCodeComponent,
    ProgressCodeComponent,
    TabelaCodeComponent,
    PaginacaoCodeComponent,
    AvataresGrupoCodeComponent,
    AvataresIndividualCodeComponent,
    AvataresRolesCodeComponent,
    StepperCodeComponent,
    ModalCodeComponent,
    TooltipCodeComponent,
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
    MatchCardCodeComponent,
    TeamsCardsCodeComponent,
    TeamsPlayerCodeComponent,
    DsCodeBlockComponent
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

  /* ─── Toggle código/visual por seção ─── */
  private readonly _showCode = signal<Record<string, boolean>>({});

  isCode(key: string): boolean {
    return !!this._showCode()[key];
  }

  toggleCode(key: string): void {
    this._showCode.update(m => ({ ...m, [key]: !m[key] }));
  }

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
