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
      class="bg-(--ow-surface) border border-(--ow-border) [clip-path:polygon(5%_0,100%_0,100%_95%,95%_100%,0_100%,0_5%)] min-w-[280px] overflow-hidden [box-shadow:var(--shadow-card)]"
    >
      <!-- Header -->
      <div
        class="bg-(--ow-surface-sunken) px-4 py-[10px] text-[0.72rem] font-bold text-(--ow-text-muted) uppercase tracking-[0.1em] flex justify-between items-center"
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
          <span class="font-bold text-[0.95rem] text-(--ow-text)">{{ team.name }}</span>
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
      'px-[18px] py-[14px] flex justify-between items-center border-b border-(--ow-border) last:border-0 transition-colors duration-200 hover:bg-(--ow-orange-tint)';
    const winner = team.winner ? 'bg-(--ow-orange-tint-strong) border-l-4 border-l-(--ow-orange)' : '';
    return [base, winner].filter(Boolean).join(' ');
  }

  scoreClass(team: OwMatchTeam): string {
    return team.winner
      ? 'font-black text-[1.2rem] text-(--ow-green-text)'
      : 'font-black text-[1.2rem] text-(--ow-orange-text)';
  }
}
