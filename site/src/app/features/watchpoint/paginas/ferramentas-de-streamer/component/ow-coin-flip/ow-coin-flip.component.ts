import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type FlipDeg = '720deg' | '900deg';

@Component({
  selector: 'ow-coin-flip',
  host: {
    // substitui doc.querySelector(':root').style.setProperty('--flips', ...)
    '[style.--flips]': 'flips()',
  },
  imports: [],
  templateUrl: './ow-coin-flip.component.html',
  styleUrl: './ow-coin-flip.component.css',
})
export class OwCoinFlipComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly isFlipping = signal(false);
  readonly anim = signal(false);
  readonly flips = signal<FlipDeg>('720deg');

  // só pra exemplo (se tu já tem as .line no HTML, pode remover)
  readonly lines = signal(Array.from({ length: 8 }, (_, i) => i));

  ngAfterViewInit(): void {
    // SSR-safe: não roda no server
    if (!this.isBrowser) return;
  }

  flip(): void {
    // SSR-safe: não executa lógica interativa/random no server
    if (!this.isBrowser) return;

    if (this.isFlipping()) return;
    this.isFlipping.set(true);

    // remove anim atual
    this.anim.set(false);

    // escolhe cara/coroa
    this.flips.set(Math.random() > 0.5 ? '900deg' : '720deg');

    // reaplica a classe em “próximo frame”
    this.nextFrame(() => this.anim.set(true));
  }

  onCoinAnimationEnd(): void {
    if (!this.isBrowser) return;
    this.isFlipping.set(false);
  }

  private nextFrame(fn: () => void): void {
    // sem window; globalThis é seguro (e existe no browser e no Node)
    const raf = (globalThis as typeof globalThis & { requestAnimationFrame?: (cb: FrameRequestCallback) => number })
      .requestAnimationFrame;

    if (typeof raf === 'function') {
      raf(() => fn());
      return;
    }

    // fallback (caso algum ambiente não tenha rAF)
    setTimeout(fn, 0);
  }
}
