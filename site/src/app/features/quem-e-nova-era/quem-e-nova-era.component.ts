import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';
import { ProximasPartidasComponent } from './components/proximas-partidas/proximas-partidas.component';

@Component({
  selector: 'app-quem-e-nova-era',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroComponent, ProximasPartidasComponent],
  templateUrl: './quem-e-nova-era.component.html',
  styleUrl: './quem-e-nova-era.component.css',
})
export class QuemENovaEraComponent {}