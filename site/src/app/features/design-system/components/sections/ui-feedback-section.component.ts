import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';
import { AlertsComponent } from '../../../../shared/alerts/alerts.component';

import { BadgeComponent } from '../../../../shared/design-system/badge/badge.component';
import { TagComponent } from '../../../../shared/design-system/tag/tag.component';
import { DividerComponent } from '../../../../shared/design-system/divider/divider.component';
import { ToastComponent } from '../../../../shared/design-system/toast/toast.component';

import { BotoesVariantesCodeComponent } from '../botoes-variantes.code';
import { BotoesTabanhosCodeComponent } from '../botoes-tamanhos.code';
import { BotoesEstadosCodeComponent } from '../botoes-estados.code';
import { BadgesBadgesCodeComponent } from '../badges-badges.code';
import { BadgesTagsCodeComponent } from '../badges-tags.code';
import { BadgesHeroCodeComponent } from '../badges-hero.code';
import { CardsBaseCodeComponent } from '../cards-base.code';
import { CardsPremiacaoCodeComponent } from '../cards-premiacao.code';
import { AlertasAlertasCodeComponent } from '../alertas-alertas.code';
import { AlertasToastsCodeComponent } from '../alertas-toasts.code';
import { DivisorPadraoCodeComponent } from '../divisor-padrao.code';
import { DivisorLabelCodeComponent } from '../divisor-label.code';

@Component({
  selector: 'ds-ui-feedback-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonsComponent,
    CardComponent,
    AlertsComponent,
    BadgeComponent,
    TagComponent,
    DividerComponent,
    ToastComponent,
    BotoesVariantesCodeComponent,
    BotoesTabanhosCodeComponent,
    BotoesEstadosCodeComponent,
    BadgesBadgesCodeComponent,
    BadgesTagsCodeComponent,
    BadgesHeroCodeComponent,
    CardsBaseCodeComponent,
    CardsPremiacaoCodeComponent,
    AlertasAlertasCodeComponent,
    AlertasToastsCodeComponent,
    DivisorPadraoCodeComponent,
    DivisorLabelCodeComponent,
  ],
  templateUrl: './ui-feedback-section.component.html',
})
export class UiFeedbackSectionComponent {
  readonly tags = signal(['DPS', 'Tank', 'Semi-Final', 'Temporada 2025']);

  private readonly showCode = signal<Record<string, boolean>>({});

  isCode(key: string): boolean {
    return !!this.showCode()[key];
  }

  toggleCode(key: string): void {
    this.showCode.update((map) => ({ ...map, [key]: !map[key] }));
  }

  removeTag(tag: string): void {
    this.tags.update((items) => items.filter((item) => item !== tag));
  }
}
