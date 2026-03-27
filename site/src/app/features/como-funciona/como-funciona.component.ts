import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '../../shared/design-system/badge/badge.component';
import { CardComponent } from '../../shared/card/card.component';
import { DividerComponent } from '../../shared/design-system/divider/divider.component';
import { TabsComponent, TabsItemComponent } from '../../shared/tabs/tabs.component';

@Component({
  selector: 'app-como-funciona',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    BadgeComponent,
    CardComponent,
    DividerComponent,
    TabsComponent,
    TabsItemComponent,
  ],
  templateUrl: './como-funciona.component.html',
})
export class ComoFuncionaComponent {}
