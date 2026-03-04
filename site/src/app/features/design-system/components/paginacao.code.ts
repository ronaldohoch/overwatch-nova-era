import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-paginacao',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class PaginacaoCodeComponent {
  readonly code = `<!-- No componente (.ts) -->
readonly currentPage = signal(1);
readonly totalPages = signal(8);

onPageChange(page: number): void {
  this.currentPage.set(page);
}

<!-- No template (.html) -->
<ow-pagination
  [currentPage]="currentPage()"
  [totalPages]="totalPages()"
  (pageChange)="onPageChange($event)">
</ow-pagination>

<p class="mt-4 text-[0.875rem] text-[#5f6368]">
  Página
  <span class="text-[#f06314] font-extrabold">{{ currentPage() }}</span>
  de
  <span class="font-extrabold text-[#111111]">{{ totalPages() }}</span>
</p>`;
}
