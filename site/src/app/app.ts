import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./core/header/header";
import { Footer } from "./core/footer/footer";
import { DiagonalGridBgComponent } from './shared/diagonal-grid-bg/diagonal-grid-bg.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, DiagonalGridBgComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}
