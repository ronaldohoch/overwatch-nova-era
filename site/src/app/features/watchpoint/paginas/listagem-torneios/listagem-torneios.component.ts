import { Component } from '@angular/core';
import { ListItemComponent } from '../../../../shared/list-item/list-item.component';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';

@Component({
  selector: 'app-listagem-torneios',
  imports: [ListItemComponent,ButtonsComponent],
  templateUrl: './listagem-torneios.component.html',
  styleUrl: './listagem-torneios.component.css',
})
export class ListagemTorneiosComponent {

}
