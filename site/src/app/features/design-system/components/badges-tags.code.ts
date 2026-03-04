import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DsCodeBlockComponent } from './ds-code-block/ds-code-block.component';

@Component({
  selector: 'ds-code-badges-tags',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsCodeBlockComponent],
  template: `<ds-code-block [code]="code" />`,
})
export class BadgesTagsCodeComponent {
  readonly code = `<!-- Tags removíveis com ow-tag -->

<!-- No componente (.ts) -->
readonly tags = signal(['DPS', 'Tank', 'Semi-Final', 'Temporada 2025']);

removeTag(tag: string): void {
  this.tags.update(t => t.filter(x => x !== tag));
}

<!-- No template (.html) -->
@for (tag of tags(); track tag) {
  <ow-tag variant="orange" [removable]="true" (removed)="removeTag(tag)">
    {{ tag }}
  </ow-tag>
}

@if (tags().length === 0) {
  <span class="text-[0.875rem] text-[#9aa0a6] italic">
    Todas as tags foram removidas
  </span>
}`;
}
