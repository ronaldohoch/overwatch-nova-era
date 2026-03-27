import { Component, computed, input, output } from '@angular/core';
import { BracketMatch } from '../../brackets/brackets.service';

export interface TeamDisplay {
  id: string;
  name: string;
  logoUrl?: string | null;
}

@Component({
  selector: 'app-match-card',
  imports: [],
  templateUrl: './match-card.component.html',
  styleUrl: './match-card.component.css',
})
export class MatchCardComponent {
  match = input.required<BracketMatch>();
  team1 = input<TeamDisplay | null>(null);
  team2 = input<TeamDisplay | null>(null);
  label = input<string>('');
  canReport = input(false);
  readonly reportRequested = output<BracketMatch>();

  readonly isLive = computed(() => this.match().status === 'running');
  readonly isFinished = computed(() => this.match().status === 'finished');
  readonly isWalkover = computed(() => this.match().walkover === true);
  readonly canTriggerReport = computed(() => {
    if (!this.canReport()) return false;
    const status = this.match().status;
    return status === 'ready' || status === 'running';
  });

  readonly isTeam1Winner = computed(
    () => this.match().winnerId !== null && this.match().winnerId === this.team1()?.id,
  );
  readonly isTeam2Winner = computed(
    () => this.match().winnerId !== null && this.match().winnerId === this.team2()?.id,
  );

  readonly team1Initials = computed(() => this.initials(this.team1()?.name));
  readonly team2Initials = computed(() => this.initials(this.team2()?.name));

  readonly score1 = computed(() => {
    if (this.isWalkover() && this.isFinished() && !this.isTeam1Winner()) return 'W.O.';
    return this.match().team1Score !== null ? String(this.match().team1Score) : '–';
  });
  readonly score2 = computed(() => {
    if (this.isWalkover() && this.isFinished() && !this.isTeam2Winner()) return 'W.O.';
    return this.match().team2Score !== null ? String(this.match().team2Score) : '–';
  });

  readonly team1RowClass = computed(() => this.rowClass(this.isTeam1Winner()));
  readonly team2RowClass = computed(() => this.rowClass(this.isTeam2Winner()));

  readonly score1Class = computed(() =>
    this.isWalkover() && !this.isTeam1Winner()
      ? 'font-black text-[1rem] text-(--ow-gray-400)'
      : this.scoreClass(this.isTeam1Winner()),
  );
  readonly score2Class = computed(() =>
    this.isWalkover() && !this.isTeam2Winner()
      ? 'font-black text-[1rem] text-(--ow-gray-400)'
      : this.scoreClass(this.isTeam2Winner()),
  );

  onReportClick(): void {
    this.reportRequested.emit(this.match());
  }

  private rowClass(isWinner: boolean): string {
    const base =
      'flex justify-between items-center px-[18px] py-[14px] border-b border-(--ow-gray-100) transition-colors duration-200 last:border-b-0';
    return isWinner
      ? `${base} bg-[rgba(240,99,20,0.08)] border-l-4 border-l-(--ow-orange)`
      : `${base} hover:bg-[rgba(240,99,20,0.04)]`;
  }

  private scoreClass(isWinner: boolean): string {
    return isWinner
      ? 'font-black text-[1.2rem] text-(--ow-green)'
      : 'font-black text-[1.2rem] text-(--ow-orange)';
  }

  private initials(name?: string | null): string {
    if (!name) return '??';
    return name.trim().substring(0, 2).toUpperCase();
  }
}
