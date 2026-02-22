import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { OwOverwatchLoaderComponent } from '../../../../../../shared/ow-overwatch-loader/ow-overwatch-loader.component';

@Component({
  selector: 'ow-stats-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OwOverwatchLoaderComponent],
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
  loading = input(false);

  /** Ex: "Progresso de partidas jogadas" */
  ariaLabel = input<string>('Progresso');

  progressPct = computed(() => {
    const v = this.progress();
    if (!Number.isFinite(v)) return 0;
    return Math.min(100, Math.max(0, v));
  });

  progressAriaLabel = computed(() => this.ariaLabel());
}
