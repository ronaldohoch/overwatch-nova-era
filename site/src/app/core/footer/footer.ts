import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

export type FooterLink = Readonly<{
  label: string;
  /** rota interna (RouterLink) */
  link?: string;
  queryParams?: Readonly<Record<string, string>>;
  /** link externo (abre em nova aba) */
  href?: string;
}>;

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
})
export class Footer {
  /** Paginas do campeonato STG Overwatch Open. */
  readonly stgLinks: readonly FooterLink[] = [
    { label: 'Regulamento', link: '/regras-stg' },
    { label: 'Torneio', link: `/torneios/${environment.TOURNAMENT_ID}` },
    { label: 'Chaveamento', link: '/torneio' },
  ];

  /** Paginas da Copa Overwatch Nova Era. */
  readonly novaEraLinks: readonly FooterLink[] = [
    { label: 'Início', link: '/' },
    { label: 'Quem é Nova Era?', link: '/quem-e-nova-era' },
    { label: 'Como funciona', link: '/quem-e-nova-era', queryParams: { tab: 'como-funciona' } },
    { label: 'Regras de conduta', link: '/quem-e-nova-era', queryParams: { tab: 'regras' } },
    { label: 'Duvidas frequentes', link: '/duvidas-frequentes' },
    { label: 'Minha conta', link: '/login' },
  ];

  /** Links de apoio e referencias externas. */
  readonly recursosLinks: readonly FooterLink[] = [
    { label: 'Site Oficial Overwatch', href: 'https://overwatch.blizzard.com' },
    { label: 'Overwatch Esports', href: 'https://esports.overwatch.com' },
    { label: 'Press Kit', href: 'https://blizzard.gamespress.com/overwatch' },
    { label: 'Design system', link: '/design-system' },
  ];
}
