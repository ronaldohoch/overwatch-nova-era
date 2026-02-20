import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'ow-stats-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:'./stats-card.component.html',
  styleUrl:'./stats-card.component.css',
})
export class StatsCardComponent {
  customClass = input<string>('');
  title = input.required<string>();
  value = input.required<string | number>();
  subtitle = input.required<string>();

  /** 0..100 */
  progress = input<number>(0);

  /** Ex: "Progresso de partidas jogadas" */
  ariaLabel = input<string>('Progresso');

  progressPct = computed(() => {
    const v = this.progress();
    if (!Number.isFinite(v)) return 0;
    return Math.min(100, Math.max(0, v));
  });

  progressAriaLabel = computed(() => this.ariaLabel());
}
