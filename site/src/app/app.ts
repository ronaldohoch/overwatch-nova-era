import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Header } from "./core/header/header";
import { Footer } from "./core/footer/footer";
import { DiagonalGridBgComponent } from './shared/diagonal-grid-bg/diagonal-grid-bg.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, DiagonalGridBgComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly outletParentBaseClass = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60dvh]';
  currentPageClass = this.resolvePageClass(this.router.url);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentPageClass = this.resolvePageClass(event.urlAfterRedirects);
      });
  }

  private resolvePageClass(url: string): string {
    const cleanUrl = (url || '/')
      .split(/[?#]/)[0]
      .replace(/^\/+|\/+$/g, '');

    if (!cleanUrl) return 'page-home';

    const classSuffix = cleanUrl
      .toLowerCase()
      .replace(/\//g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return classSuffix ? `page-${classSuffix}` : 'page-home';
  }
}
