import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports:[],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:'./footer.html'
})
export class Footer {}
