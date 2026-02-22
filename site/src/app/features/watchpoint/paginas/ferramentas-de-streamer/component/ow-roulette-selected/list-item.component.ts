import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type OwScheduleStatus = 'upcoming' | 'live' | 'finished';

@Component({
  selector: 'ow-roulete-selected',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:'./list-item.component.html',
})
export class OwRouletteSelectedComponent {
  text = input.required<string>();
  message = input<string>('Último sorteado:');

  containerClass = computed(() => [
    // .ow-schedule-item (migrado)
    'flex flex-col md:flex-row md:items-center gap-4 md:gap-0',
    'p-6 mb-4 bg-white',
    'border-l-4 border-l-[color:var(--ow-orange)]',
    'shadow-[var(--shadow-card)]',
    'transition-all duration-300 ease-out',
    'hover:bg-[color:var(--ow-gray-50)] hover:shadow-[var(--shadow-card-hover)]',
  ].join(' '));
}
