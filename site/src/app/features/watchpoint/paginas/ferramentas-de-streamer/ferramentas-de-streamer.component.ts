import { Component, signal } from '@angular/core';
import { OwCoinFlipComponent } from './component/ow-coin-flip/ow-coin-flip.component';
// import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { CardComponent } from '../../../../shared/card/card.component';
import { OwRouletteComponent } from './component/ow-roulette/ow-roulette.component';

type Restaurant = { id: string; name: string };

@Component({
  selector: 'app-ferramentas-de-streamer',
  imports: [
    OwCoinFlipComponent,
    OwRouletteComponent
    // CardComponent
  ],
  templateUrl: './ferramentas-de-streamer.component.html',
  styleUrl: './ferramentas-de-streamer.component.css',
})
export class FerramentasDeStreamerComponent {

}
