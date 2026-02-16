import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FaqItemComponent } from './components/faq-item/faq-item.component'

export type OwFaqEntry = Readonly<{
  id?: string;
  question: string;
  answer: string;
}>;

export const faqItems: OwFaqEntry[] = [
  {
    question: 'What type of tournament is OWCS?',
    answer: 'OWCS is an open ecosystem Overwatch esports program where the best teams across each region will compete...',
  },
  {
    question: 'Como funciona o check-in?',
    answer: 'Você faz login, escolhe role (se random teams) e confirma presença.',
  },
  {
    question: 'What type of tournament is OWCS?',
    answer: 'OWCS is an open ecosystem Overwatch esports program where the best teams across each region will compete...',
  },
  {
    question: 'Como funciona o check-in?',
    answer: 'Você faz login, escolhe role (se random teams) e confirma presença.',
  },
  {
    question: 'What type of tournament is OWCS?',
    answer: 'OWCS is an open ecosystem Overwatch esports program where the best teams across each region will compete...',
  },
  {
    question: 'Como funciona o check-in?',
    answer: 'Você faz login, escolhe role (se random teams) e confirma presença.',
  },
  {
    question: 'What type of tournament is OWCS?',
    answer: 'OWCS is an open ecosystem Overwatch esports program where the best teams across each region will compete...',
  },
  {
    question: 'Como funciona o check-in?',
    answer: 'Você faz login, escolhe role (se random teams) e confirma presença.',
  },
];

@Component({
  selector: 'ow-faq',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaqItemComponent],
  template: `
    <section class="w-full" aria-label="Perguntas frequentes">
      @for (item of items(); track item.id ?? $index; let i = $index) {
        <faq-item
          [question]="item.question"
          [answer]="item.answer"
          [expanded]="allowMultiple() ? null : openIndex() === i"
          (toggle)="onToggle(i)"
        />
      }
    </section>
  `,
})
export class FaqComponent {
  readonly items = input<ReadonlyArray<OwFaqEntry>>(faqItems);
  readonly allowMultiple = input(false);

  readonly openIndex = signal<number | null>(0);

  onToggle(index: number): void {
    if (this.allowMultiple()) return; // no modo multi o item se auto-gerencia
    this.openIndex.update((curr) => (curr === index ? null : index));
  }
}
