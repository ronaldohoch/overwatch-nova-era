import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'ow-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="flex items-center gap-1" aria-label="Paginação">
      <!-- Anterior -->
      <button
        type="button"
        [disabled]="currentPage() <= 1"
        [class]="pageButtonClass(false)"
        [class.opacity-35]="currentPage() <= 1"
        [class.cursor-not-allowed]="currentPage() <= 1"
        aria-label="Página anterior"
        (click)="onPageChange(currentPage() - 1)"
      >‹</button>

      <!-- Páginas -->
      @for (item of pages(); track item.key) {
        @if (item.ellipsis) {
          <span
            class="w-[38px] h-[38px] flex items-center justify-center text-[0.7rem] tracking-[0.05em] text-[#5f6368]"
          >…</span>
        } @else {
          <button
            type="button"
            [class]="item.page === currentPage() ? activePageClass : pageButtonClass(false)"
            [attr.aria-current]="item.page === currentPage() ? 'page' : null"
            [attr.aria-label]="'Página ' + item.page"
            (click)="onPageChange(item.page!)"
          >{{ item.page }}</button>
        }
      }

      <!-- Próximo -->
      <button
        type="button"
        [disabled]="currentPage() >= totalPages()"
        [class]="pageButtonClass(false)"
        [class.opacity-35]="currentPage() >= totalPages()"
        [class.cursor-not-allowed]="currentPage() >= totalPages()"
        aria-label="Próxima página"
        (click)="onPageChange(currentPage() + 1)"
      >›</button>
    </nav>
  `,
  host: { class: 'block' },
})
export class PaginationComponent {
  readonly currentPage = input(1);
  readonly totalPages = input(1);
  /** Nº máximo de botões de página visíveis (excluindo prev/next) */
  readonly maxVisible = input(5);
  readonly pageChange = output<number>();

  private readonly BTN_STRUCT =
    'w-[38px] h-[38px] flex items-center justify-center text-[0.82rem] font-extrabold border-2 cursor-pointer transition-all duration-200 [clip-path:polygon(15%_0,100%_0,85%_100%,0_100%)] bg-white font-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f06314]';

  private readonly BASE_BTN =
    this.BTN_STRUCT + ' border-[#e8eaed] text-[#3c4043] hover:border-[#f06314] hover:text-[#f06314]';

  readonly activePageClass =
    this.BTN_STRUCT + ' border-[#f06314] text-[#f06314]';

  pageButtonClass(_active: boolean): string {
    return this.BASE_BTN;
  }

  readonly pages = computed<Array<{ key: string; page?: number; ellipsis?: boolean }>>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const max = this.maxVisible();

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => ({ key: String(i + 1), page: i + 1 }));
    }

    const half = Math.floor(max / 2);
    const items: Array<{ key: string; page?: number; ellipsis?: boolean }> = [];

    // sempre mostra página 1
    items.push({ key: '1', page: 1 });

    const start = Math.max(2, current - half);
    const end = Math.min(total - 1, current + half);

    if (start > 2) {
      items.push({ key: 'ellipsis-start', ellipsis: true });
    }

    for (let p = start; p <= end; p++) {
      items.push({ key: String(p), page: p });
    }

    if (end < total - 1) {
      items.push({ key: 'ellipsis-end', ellipsis: true });
    }

    // sempre mostra última página
    items.push({ key: String(total), page: total });

    return items;
  });

  onPageChange(page: number): void {
    const clamped = Math.min(this.totalPages(), Math.max(1, page));
    if (clamped !== this.currentPage()) {
      this.pageChange.emit(clamped);
    }
  }
}
