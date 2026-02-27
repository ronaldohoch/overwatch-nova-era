import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  DestroyRef,
  QueryList,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type OwStepState = 'pending' | 'active' | 'done';

/* ─── Step Item ─── */
@Component({
  selector: 'ow-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class StepComponent {
  readonly label = input.required<string>();
  /** Sobrescreve o estado automático do stepper */
  readonly state = input<OwStepState | undefined>(undefined);
}

/* ─── Stepper ─── */
@Component({
  selector: 'ow-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center" role="list" aria-label="Progresso">
      @for (step of stepsWithState(); track step.label; let i = $index; let last = $last) {
        <!-- Step -->
        <div class="flex flex-col items-center" role="listitem">
          <!-- Indicator -->
          <div [class]="indicatorClass(step.state)">
            @if (step.state === 'done') {
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            } @else {
              {{ i + 1 }}
            }
          </div>
          <!-- Label -->
          <div [class]="labelClass(step.state)">{{ step.label }}</div>
        </div>

        <!-- Connector (não no último) -->
        @if (!last) {
          <div [class]="connectorClass(step.state)" aria-hidden="true"></div>
        }
      }
    </div>
  `,
  host: { class: 'block' },
})
export class StepperComponent implements AfterContentInit {
  @ContentChildren(StepComponent) private readonly projectedSteps!: QueryList<StepComponent>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly stepsState = signal<readonly StepComponent[]>([]);

  /** Índice do passo ativo (0-based). -1 = nenhum */
  readonly activeStep = input(0);

  readonly stepsWithState = computed(() => {
    const active = this.activeStep();
    return this.stepsState().map((step, i) => {
      const override = step.state();
      const autoState: OwStepState = i < active ? 'done' : i === active ? 'active' : 'pending';
      return { label: step.label(), state: override ?? autoState };
    });
  });

  ngAfterContentInit(): void {
    this.sync();
    this.projectedSteps.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sync());
  }

  private sync(): void {
    this.stepsState.set(this.projectedSteps.toArray());
  }

  indicatorClass(state: OwStepState): string {
    const base =
      'w-10 h-10 [clip-path:polygon(20%_0,100%_0,80%_100%,0_100%)] flex items-center justify-center font-black text-[0.9rem] transition-all duration-300';
    const states: Record<OwStepState, string> = {
      done: 'bg-[#34a853] text-white',
      active: 'bg-[#f06314] text-white',
      pending: 'bg-[#e8eaed] text-[#5f6368]',
    };
    return `${base} ${states[state]}`;
  }

  labelClass(state: OwStepState): string {
    const base = 'text-[0.7rem] font-bold uppercase tracking-[0.1em] mt-2 text-center';
    const states: Record<OwStepState, string> = {
      done: 'text-[#34a853]',
      active: 'text-[#f06314]',
      pending: 'text-[#5f6368]',
    };
    return `${base} ${states[state]}`;
  }

  connectorClass(state: OwStepState): string {
    const base = 'flex-1 h-[2px] self-start mt-5 transition-colors duration-300';
    return state === 'done' ? `${base} bg-[#34a853]` : `${base} bg-[#e8eaed]`;
  }
}
