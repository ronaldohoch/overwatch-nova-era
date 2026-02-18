import { Component } from '@angular/core';
import { ButtonsComponent } from '../../../../shared/buttons/buttons';
import { OwRandomHeroQuoteComponent } from "./components/ow-random-hero-quote/ow-random-hero-quote.component";

@Component({
  selector: 'app-dashboard',
  imports: [ButtonsComponent, OwRandomHeroQuoteComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {

}
