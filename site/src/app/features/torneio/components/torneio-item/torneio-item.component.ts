import { Component, computed, input } from '@angular/core';
import { TorneioTeamComponent } from '../torneio-team/torneio-team.component';
import { MatchFormat } from '../../enums/match-format';
import { Match } from '../../torneio.component';

@Component({
  selector: 'app-torneio-item',
  imports: [TorneioTeamComponent],
  templateUrl: './torneio-item.component.html',
  styleUrl: './torneio-item.component.css',
})
export class TorneioItemComponent {
  match = input.required<Match>();

  readonly isFinished = computed(() => {
    const m = this.match();
    const hasWinner = (m.winnerTeamId ?? '').trim().length > 0;
    const hasScore =
      !!m.score &&
      Number.isFinite(m.score.teamA) &&
      Number.isFinite(m.score.teamB);

    return hasWinner && hasScore;
  });

  readonly statusText = computed(() => (this.isFinished() ? 'FINALIZADO' : 'PENDENTE'));

  readonly statusClass = computed(() =>
    this.isFinished()
      ? 'text-(--ow-green) font-extrabold'
      : 'text-(--ow-gray-500) font-bold',
  );
}
