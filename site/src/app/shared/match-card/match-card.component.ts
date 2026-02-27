import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BadgeComponent } from '../design-system/badge/badge.component';

export type OwMatchStatus = 'live' | 'upcoming' | 'finished';

export interface OwMatchTeam {
  name: string;
  score: number | string;
  winner?: boolean;
  /** URL do logo ou sigla para placeholder */
  logo?: string;
}

@Component({
  selector: 'ow-match-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <div
      class="bg-white border border-[#e8eaed] [clip-path:polygon(5%_0,100%_0,100%_95%,95%_100%,0_100%,0_5%)] min-w-[280px] overflow-hidden [box-shadow:0_2px_12px_rgba(0,0,0,0.08)]"
    >
      <!-- Header -->
      <div
        class="bg-[#f1f3f4] px-4 py-[10px] text-[0.72rem] font-bold text-[#5f6368] uppercase tracking-[0.1em] flex justify-between items-center"
      >
        <span>{{ stage() }}</span>
        @switch (status()) {
          @case ('live') {
            <ow-badge variant="live">🔴 AO VIVO</ow-badge>
          }
          @case ('upcoming') {
            <span>{{ scheduledAt() }}</span>
          }
          @case ('finished') {
            <span>FINALIZADO</span>
          }
        }
      </div>

      <!-- Teams -->
      @for (team of teams(); track team.name) {
        <div [class]="teamRowClass(team)">
          <span class="font-bold text-[0.95rem] text-[#202124]">{{ team.name }}</span>
          <span [class]="scoreClass(team)">{{ team.score }}</span>
        </div>
      }
    </div>
  `,
  host: { class: 'contents' },
})
export class MatchCardComponent {
  readonly stage = input('');
  readonly status = input<OwMatchStatus>('upcoming');
  /** Texto exibido quando status = 'upcoming' (ex: "HOJE 20:00") */
  readonly scheduledAt = input('');
  readonly teams = input<OwMatchTeam[]>([]);

  teamRowClass(team: OwMatchTeam): string {
    const base =
      'px-[18px] py-[14px] flex justify-between items-center border-b border-[#f1f3f4] last:border-0 transition-colors duration-200 hover:bg-[rgba(240,99,20,0.04)]';
    const winner = team.winner ? 'bg-[rgba(240,99,20,0.08)] border-l-4 border-l-[#f06314]' : '';
    return [base, winner].filter(Boolean).join(' ');
  }

  scoreClass(team: OwMatchTeam): string {
    return team.winner
      ? 'font-black text-[1.2rem] text-[#34a853]'
      : 'font-black text-[1.2rem] text-[#f06314]';
  }
}
