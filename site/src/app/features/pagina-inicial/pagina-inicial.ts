import { Component } from '@angular/core';
// import { ButtonsComponent } from '../../shared/buttons/buttons';
import { HeroComponent } from './components/hero/hero.component';

@Component({
  selector: 'app-pagina-inicial',
  imports: [HeroComponent],
  templateUrl: './pagina-inicial.html',
  styleUrl: './pagina-inicial.css',
})
export class PaginaInicial {

}
