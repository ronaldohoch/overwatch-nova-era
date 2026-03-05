import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';
import {
  PlayerAvatarComponent,
  RoleBadgeComponent,
} from '../../../../shared/design-system/avatar/avatar.component';
import { MatchCardComponent, type OwMatchTeam } from '../../../../shared/match-card/match-card.component';

import { MatchCardCodeComponent } from '../match-card.code';
import { TeamsCardsCodeComponent } from '../teams-cards.code';
import { TeamsPlayerCodeComponent } from '../teams-player.code';

@Component({
  selector: 'ds-match-teams-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonsComponent,
    CardComponent,
    PlayerAvatarComponent,
    RoleBadgeComponent,
    MatchCardComponent,
    MatchCardCodeComponent,
    TeamsCardsCodeComponent,
    TeamsPlayerCodeComponent,
  ],
  templateUrl: './match-teams-section.component.html',
})
export class MatchTeamsSectionComponent {
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

  private readonly showCode = signal<Record<string, boolean>>({});

  isCode(key: string): boolean {
    return !!this.showCode()[key];
  }

  toggleCode(key: string): void {
    this.showCode.update((map) => ({ ...map, [key]: !map[key] }));
  }
}
