import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ow-section-title',
  standalone: true,
  imports: [],
  templateUrl: './section-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionTitleComponent {}
