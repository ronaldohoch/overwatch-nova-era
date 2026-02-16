import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports:[NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:'./footer.html'
})
export class Footer {}
