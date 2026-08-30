import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from '../hero/hero.component';
import { ProximasPartidasComponent } from '../proximas-partidas/proximas-partidas.component';

@Component({
  selector: 'app-quem-e-nova-era-sobre',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroComponent, ProximasPartidasComponent],
  templateUrl: './sobre.component.html',
})
export class SobreComponent {}
