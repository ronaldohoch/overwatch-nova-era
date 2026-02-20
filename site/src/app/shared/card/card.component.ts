import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

const BASE_CARD_CLASS =
  [
    // base
    'group',
    'bg-[var(--ow-white)]',
    'border',
    'border-[var(--ow-gray-200)]',
    'overflow-hidden',
    // shape + shadow
    '[clip-path:polygon(5%_0,100%_0,100%_95%,95%_100%,0_100%,0_5%)]',
    '[box-shadow:0_2px_12px_rgba(0,0,0,0.08)]',
    // motion
    'transition-all',
    'duration-300',
    'ease-out',
    // hover
    'hover:border-[var(--ow-orange)]',
    'hover:[box-shadow:0_8px_24px_rgba(0,0,0,0.12)]',
    'hover:-translate-y-1',
    // a11y focus (quando houver link/botão dentro)
    'focus-within:ring-2',
    'focus-within:ring-[var(--ow-orange)]',
    'focus-within:ring-offset-2',
    'focus-within:ring-offset-[var(--ow-white)]',
    // reduce motion
    // 'motion-reduce:transition-none',
  ].join(' ');

@Component({
  selector: 'ow-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})
export class CardComponent {
  /** vira data-status no DOM (ex: "quarter") */
  status = input<string | null>(null);

  /** replica o <div class="p-6"> do teu exemplo */
  padded = input(true, { transform: booleanAttribute });

  /** permite adicionar classes tailwind extras no card */
  cardClass = input('');

  /** permite ajustar o wrapper interno quando padded=true */
  contentClass = input('');

  readonly classes = computed(() => {
    const extra = this.cardClass().trim();
    return extra ? `${BASE_CARD_CLASS} ${extra}` : BASE_CARD_CLASS;
  });

  readonly contentClasses = computed(() => {
    const extra = this.contentClass().trim();
    return extra ? `p-6 ${extra}` : 'p-6';
  });
}
