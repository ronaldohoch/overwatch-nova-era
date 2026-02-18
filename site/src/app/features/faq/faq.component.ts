import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FaqItemComponent } from './components/faq-item/faq-item.component'

export type OwFaqEntry = Readonly<{
  id?: string;
  question: string;
  answer: string;
}>;

export const faqItems: OwFaqEntry[] = [
  {
    question: 'PORQUE TIMES RANDOMIZADOS?',
    answer: 'A comunidade tá vivendo uma nova fase: tem jogadores novos e gente voltando por causa da atualização, e ao mesmo tempo tem a galera que nunca parou. Pra todo mundo se divertir e querer participar, a Mini Copa vai ser com times formados por sorteio. Assim os novatos/retornando jogam junto com veteranos, aprendem mais rápido, e ainda podem surgir novos squads depois do campeonato.',
  },
  {
    question: 'EXISTEM RESTRIÇÕES DE IDADE?',
    answer: 'Todos os jogadores com 17 anos ou mais são elegíveis para competir.',
  },
  {
    question: 'EXISTEM RESTRIÇÕES DE PATENTE?',
    answer: 'Não há restrições de classificação.',
  },
  {
    question: 'O NOVA ERA É MULTIPLATAFORMA?',
    answer: 'Sim! Os times serão mistos tanto de ranking quanto de plataforma.',
  },
  {
    question: 'ONDE POSSO ENCONTRAR AS REGRAS DA COPA NOVA ERA?',
    answer: 'No menu do topo, existe uma sessão de regras. Elas são baseadas nas regras oficiais da OWCS',
  },
  {
    question: 'EXISTEM RECOMPENSAS DE PARTICIPAÇÃO?',
    answer: 'Estamos avaliando isso ainda.',
  },
  {
    question: 'EXISTEM RECOMPENSAS DE AUDIÊNCIA PARA OS COPA NOVA ERA?',
    answer: 'Somos um evento independente criado pela comunidade em parceria com @Overdog, @Overbee e @mano_xand, então não temos recompensas de audiência, Blizzard, nota a gente 🫣',
  },
  {
    question: 'PRECISO PARTICIPAR DA COMUNIDADE OVERWATCH_BR DA OVERDOG?',
    answer: 'Todos são bem vindos, mas você não precisa participar, apesar de que sentiremos sua falta.',
  }
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
