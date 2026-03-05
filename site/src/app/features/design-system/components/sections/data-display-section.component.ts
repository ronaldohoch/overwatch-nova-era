import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { TabsComponent, TabsItemComponent } from '../../../../shared/tabs/tabs.component';
import { BadgeComponent } from '../../../../shared/design-system/badge/badge.component';
import { ProgressComponent } from '../../../../shared/design-system/progress/progress.component';
import { PaginationComponent } from '../../../../shared/design-system/pagination/pagination.component';
import {
  AvatarComponent,
  AvatarGroupComponent,
  PlayerAvatarComponent,
  RoleBadgeComponent,
} from '../../../../shared/design-system/avatar/avatar.component';

import { TabsCodeComponent } from '../tabs.code';
import { ProgressCodeComponent } from '../progress.code';
import { TabelaCodeComponent } from '../tabela.code';
import { PaginacaoCodeComponent } from '../paginacao.code';
import { AvataresGrupoCodeComponent } from '../avatares-grupo.code';
import { AvataresIndividualCodeComponent } from '../avatares-individual.code';
import { AvataresRolesCodeComponent } from '../avatares-roles.code';

@Component({
  selector: 'ds-data-display-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonsComponent,
    TabsComponent,
    TabsItemComponent,
    BadgeComponent,
    ProgressComponent,
    PaginationComponent,
    AvatarComponent,
    AvatarGroupComponent,
    PlayerAvatarComponent,
    RoleBadgeComponent,
    TabsCodeComponent,
    ProgressCodeComponent,
    TabelaCodeComponent,
    PaginacaoCodeComponent,
    AvataresGrupoCodeComponent,
    AvataresIndividualCodeComponent,
    AvataresRolesCodeComponent,
  ],
  templateUrl: './data-display-section.component.html',
})
export class DataDisplaySectionComponent {
  readonly currentPage = signal(1);
  readonly totalPages = signal(8);

  private readonly showCode = signal<Record<string, boolean>>({});

  isCode(key: string): boolean {
    return !!this.showCode()[key];
  }

  toggleCode(key: string): void {
    this.showCode.update((map) => ({ ...map, [key]: !map[key] }));
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
