import { Component, signal } from '@angular/core';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';

@Component({
  selector: 'app-hero',
  imports: [ButtonsComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  images = signal<Array<string>>([
    '/imgs/ana-hero.webp',
    '/imgs/domina-hero.webp',
    '/imgs/reaper-hero.webp',
    '/imgs/symmetra-hero.webp',
    '/imgs/tracer-hero.webp',
  ])
}
