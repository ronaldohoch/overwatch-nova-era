import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type OwScheduleStatus = 'upcoming' | 'live' | 'finished';

@Component({
  selector: 'ow-schedule-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:'./list-item.component.html',
})
export class ListItemComponent {
  time = input<string>('20:00');
  dateLabel = input<string>('23 Fev • Dom');

  teamsLabel = input<string>('🔥 Blaze Legion vs 🛡️ Iron Guard');
  stageLabel = input<string>('Quartas de Final • MD3');

  status = input<OwScheduleStatus>('upcoming');
  statusLabel = input<string>('Em Breve');

  containerClass = computed(() => [
    // .ow-schedule-item (migrado)
    'flex flex-col md:flex-row md:items-center gap-4 md:gap-0',
    'p-6 mb-4 bg-(--ow-surface)',
    'border-l-4 border-l-(--ow-orange)',
    'shadow-(--shadow-card)',
    'transition-all duration-300 ease-out',
    'hover:bg-(--ow-surface-raised) hover:translate-x-2.5 hover:shadow-(--shadow-card-hover)',
  ].join(' '));

  statusClass = computed(() => {
    const base = [
      // .ow-schedule-status (migrado)
      'inline-flex items-center justify-center',
      'py-2 px-5 text-xs font-extrabold uppercase tracking-widest',
      '[clip-path:polygon(10%_0,100%_0,90%_100%,0%_100%)]',
      'select-none',
    ];

    const variant =
      this.status() === 'live'
        ? ['bg-(--ow-red) text-(--ow-on-accent) animate-pulse']
        : this.status() === 'finished'
          ? ['bg-(--ow-gray-400) text-(--ow-on-accent-dark)']
          : ['bg-(--ow-blue) text-(--ow-on-accent-dark)'];

    return [...base, ...variant].join(' ');
  });
}
