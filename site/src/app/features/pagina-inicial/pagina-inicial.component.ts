import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonsComponent } from '../../shared/buttons/buttons';
import { CardComponent } from '../../shared/card/card.component';
import { SectionTitleComponent } from '../../shared/section-title/section-title.component';
import { BadgeComponent } from '../../shared/design-system/badge/badge.component';
import { DividerComponent } from '../../shared/design-system/divider/divider.component';
import { environment } from '../../../environments/environment';

type Etapa = Readonly<{
  numero: string;
  titulo: string;
  texto: string;
}>;

type Destaque = Readonly<{
  titulo: string;
  texto: string;
}>;

@Component({
  selector: 'app-pagina-inicial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonsComponent,
    CardComponent,
    SectionTitleComponent,
    BadgeComponent,
    DividerComponent,
  ],
  templateUrl: './pagina-inicial.component.html',
})
export class PaginaInicialComponent {
  readonly torneioLink = `/torneios/${environment.TOURNAMENT_ID}`;

  readonly etapas: readonly Etapa[] = [
    {
      numero: '01',
      titulo: 'Campeonatos presenciais',
      texto:
        'Realizamos e sediamos campeonatos presenciais em nossa estrutura, proporcionando aos jogadores a experiência de competir em um ambiente preparado para receber o cenário competitivo. Esses eventos nos permitiram conhecer de perto diferentes comunidades, equipes e jogadores, além de entender as necessidades de quem participa e acompanha os esports.',
    },
    {
      numero: '02',
      titulo: 'Expansão para o online',
      texto:
        'Ampliamos esse projeto também para o cenário online, permitindo que equipes de diferentes regiões possam participar das nossas competições sem precisar estar fisicamente em nossa estrutura.',
    },
    {
      numero: '03',
      titulo: 'Chegada ao Overwatch',
      texto:
        'Estamos abraçando a comunidade competitiva de Overwatch com um campeonato 100% online, pensado para reunir equipes de diferentes partes do Brasil e proporcionar uma experiência competitiva organizada, acessível e voltada para a integração do cenário nacional.',
    },
  ];

  readonly destaques: readonly Destaque[] = [
    { titulo: '100% Online', texto: 'Participe de qualquer região do Brasil' },
    { titulo: 'Cenário Nacional', texto: 'Equipes de diferentes partes do país' },
    { titulo: 'Organizado', texto: 'Chaveamento, regras e acompanhamento centralizados' },
  ];
}
