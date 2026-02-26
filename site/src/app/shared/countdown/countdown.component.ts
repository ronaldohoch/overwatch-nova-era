import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';

@Component({
  selector: 'ow-countdown',
  standalone: true,
  imports: [],
  templateUrl: './countdown.component.html',
  styleUrl: './countdown.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownComponent {
  /** Target date string in the format DD/MM/AAAA HH:mm — e.g. "21/03/2026 20:00" */
  readonly targetDate = input.required<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly now = signal(new Date());

  readonly timeRemaining = computed(() => {
    const target = this.parseDate(this.targetDate());
    const diff = target.getTime() - this.now().getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      ended: false,
    };
  });

  readonly isEnded = computed(() => this.timeRemaining().ended);

  constructor() {
    afterNextRender(() => {
      const interval = setInterval(() => this.now.set(new Date()), 1000);
      this.destroyRef.onDestroy(() => clearInterval(interval));
    });
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  private parseDate(dateStr: string): Date {
    // Expects: "DD/MM/AAAA HH:mm"
    const [datePart, timePart = '00:00'] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0);
  }
}
