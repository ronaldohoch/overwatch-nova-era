import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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
  readonly compact = input(false);

  readonly rlaExact = { exact: true } as const;
  readonly rlaSubset = { exact: false } as const;

  readonly desktopClasses = computed(() => {
    const compactClasses = this.compact() ? 'text-[0.7rem] px-3' : 'text-[0.9rem] px-5';

    return `inline-block relative no-underline text-slate-600 font-bold uppercase tracking-widest ${compactClasses} py-6.25 transition-colors duration-300 ease-[ease] hover:text-[#f06314] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0 after:bg-[#f06314] after:[transition-property:all] after:duration-300 after:ease-[ease] hover:after:h-1`;
  });

  readonly mobileClasses = computed(() => {
    const compactClasses = this.compact() ? 'text-[0.7rem] px-3' : 'text-[0.9rem] px-5';

    return `inline-block relative no-underline text-slate-600 font-bold uppercase tracking-widest ${compactClasses} py-6.25 transition-colors duration-300 ease-[ease] hover:text-[#f06314] after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0 after:bg-[#f06314] after:[transition-property:all] after:duration-300 after:ease-[ease] hover:after:h-2.5`;
  });
}
