import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type HeaderNavItem = Readonly<{
  label: string;
  link: string;
  exact?: boolean;
}>;

@Component({
  selector: 'app-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './links.component.html',
  styleUrl: './links.component.css',
})
export class LinksComponent {
  readonly item = input.required<HeaderNavItem>();
  readonly mobile = input(false);

  readonly rlaExact = { exact: true } as const;
  readonly rlaSubset = { exact: false } as const;
}
