import { Component } from '@angular/core';
// import { ButtonsComponent } from '../../shared/buttons/buttons';
import { HeroComponent } from './components/hero/hero.component';
// import { CountdownComponent } from '../../shared/countdown/countdown.component';
// import { SectionTitleComponent } from '../../shared/section-title/section-title.component';
import { ProximasPartidasComponent } from './components/proximas-partidas/proximas-partidas.component';

@Component({
  selector: 'app-pagina-inicial',
  imports: [HeroComponent, /*CountdownComponent, SectionTitleComponent,*/ ProximasPartidasComponent],
  templateUrl: './pagina-inicial.html',
  styleUrl: './pagina-inicial.css',
})
export class PaginaInicial {

}
