import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchCardComponent, OwMatchStatus, OwMatchTeam } from '../../../../shared/match-card/match-card.component';

interface Partida {
  stage: string;
  status: OwMatchStatus;
  scheduledAt?: string;
  teams: OwMatchTeam[];
}

@Component({
  selector: 'app-proximas-partidas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatchCardComponent, RouterLink],
  template: `
    <section class="py-16 sm:py-20 border-b border-(--ow-gray-200)">
      <div class="mx-auto max-w-6xl px-4">
        <p class="text-sm uppercase tracking-widest text-(--ow-orange) font-bold mb-2 text-center">Copa Nova Era · 2026</p>
        <h2 class="text-4xl font-black text-center mb-12">Próximas <span class="text-(--ow-orange)">Partidas</span></h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          @for (partida of partidas; track partida.stage) {
            <div class="w-full">
              <ow-match-card
                [stage]="partida.stage"
                [status]="partida.status"
                [scheduledAt]="partida.scheduledAt ?? 'A DEFINIR'"
                [teams]="partida.teams"
              />
            </div>
          }
        </div>

        <div class="mt-10 text-center">
          <a
            routerLink="/torneios/jCrpbomkCfDF4BLPJOsu"
            class="inline-block px-8 py-3 bg-(--ow-orange) text-white font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity [clip-path:polygon(4%_0,100%_0,96%_100%,0_100%)]"
          >
            Veja as chaves completas
          </a>
        </div>
      </div>
    </section>
  `,
})
export class ProximasPartidasComponent {
  readonly partidas: Partida[] = [
    {
      stage: 'Fase de Grupos (W.O.)',
      status: 'finished',
      teams: [
        { name: 'Hunter United', score: '-', winner: true },
        { name: 'Overstone', score: 'W.O.' },
      ],
    },
    {
      stage: 'Fase de Grupos',
      status: 'upcoming',
      teams: [
        { name: 'Over Piece', score: '-' },
        { name: 'Aldeia da Folha', score: '-' },
      ],
    },
    {
      stage: 'Fase de Grupos',
      status: 'upcoming',
      teams: [
        { name: 'Picadilha do Sertão', score: '-' },
        { name: 'Trick Shot', score: '-' },
      ],
    },
    {
      stage: 'Fase de Grupos',
      status: 'upcoming',
      teams: [
        { name: 'Black Ops', score: '-' },
        { name: 'Overkill Protocoll', score: '-' },
      ],
    },
  ];
}
