import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-diagonal-grid-bg',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: {
    class: 'fixed inset-0 z-[-1] pointer-events-none',
    role: 'presentation',
    'aria-hidden': 'true',

    // fundo (cruz diagonal)
    '[style.background-image]': 'bgImage()',
    '[style.background-size]': 'bgSize()',

    // máscara (só aparece mais no “rodapé”)
    '[style.webkit-mask-image]': 'mask()',
    '[style.mask-image]': 'mask()',
  },
})
export class DiagonalGridBgComponent {
  readonly bgSize = input('40px 40px');
  readonly gridColor = input('#e5e7eb');

  readonly mask = input(
    'radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)',
  );

  bgImage(): string {
    const c = this.gridColor();
    return `
      linear-gradient(45deg, transparent 49%, ${c} 49%, ${c} 51%, transparent 51%),
      linear-gradient(-45deg, transparent 49%, ${c} 49%, ${c} 51%, transparent 51%)
    `;
  }
}
