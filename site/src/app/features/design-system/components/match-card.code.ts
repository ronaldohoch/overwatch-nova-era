import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-match-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class MatchCardCodeComponent {
  readonly code = `<!-- No componente (.ts) -->
readonly matchLive: OwMatchTeam[] = [
  { name: '⚡ Thunder Hawks', score: 3, winner: true },
  { name: '🔥 Blaze Legion',  score: 1 },
];

readonly matchUpcoming: OwMatchTeam[] = [
  { name: '🐉 Dragon Squad', score: '-' },
  { name: '❄️ Frost Giants', score: '-' },
];

readonly matchFinished: OwMatchTeam[] = [
  { name: '🌟 Nova Elite',  score: 3, winner: true },
  { name: '🎯 Precision',   score: 0 },
];

<!-- No template (.html) -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

  <ow-match-card
    stage="Quartas de Final"
    status="live"
    [teams]="matchLive">
  </ow-match-card>

  <ow-match-card
    stage="Semi Final"
    status="upcoming"
    scheduledAt="HOJE 20:00"
    [teams]="matchUpcoming">
  </ow-match-card>

  <ow-match-card
    stage="Oitavas de Final"
    status="finished"
    [teams]="matchFinished">
  </ow-match-card>

</div>

<!-- status: live | upcoming | finished -->`;
}
