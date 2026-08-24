import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonsComponent } from '../../shared/buttons/buttons';
import { DividerComponent } from '../../shared/design-system/divider/divider.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pagina-inicial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, DividerComponent],
  templateUrl: './pagina-inicial.component.html',
})
export class PaginaInicialComponent {
  readonly torneioLink = `/torneios/${environment.TOURNAMENT_ID}`;
}
