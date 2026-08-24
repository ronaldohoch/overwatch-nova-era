import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeToggleComponent } from '../theme/theme-toggle.component';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:'./footer.html'
})
export class Footer {}
