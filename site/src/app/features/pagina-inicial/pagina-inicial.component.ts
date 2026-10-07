import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonsComponent } from '../../shared/buttons/buttons';
import { DividerComponent } from '../../shared/design-system/divider/divider.component';
import { environment } from '../../../environments/environment';

/**
 * Um ponto da linha do tempo. Nao existe titulo: os textos abaixo sao os
 * paragrafos oficiais da STG e nao podem ser alterados nem resumidos, entao
 * a hierarquia visual vem do marcador, nao de um rotulo escrito.
 */
type Marco = Readonly<{
  /** Ordinal exibido no marcador. Ausente no marco de virada. */
  numero?: string;
  texto: string;
  virada?: boolean;
}>;

@Component({
  selector: 'app-pagina-inicial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonsComponent, DividerComponent],
  templateUrl: './pagina-inicial.component.html',
})
export class PaginaInicialComponent {
  readonly torneioLink = `/torneios/${environment.TOURNAMENT_ID}`;

  /** Formulario externo de inscricao das equipes. */
  readonly cadastroLink =
    'https://docs.google.com/forms/d/e/1FAIpQLSd81SOpEm9nMCniwZw1Fs-gkLknY5BkjmdtDFZyl1JI2lrTfA/viewform?usp=dialog';

  readonly linhaDoTempo: readonly Marco[] = [
    {
      numero: '01',
      texto:
        'Ao longo desse projeto, já realizamos e sediamos campeonatos presenciais em nossa estrutura, proporcionando aos jogadores a experiência de competir em um ambiente preparado para receber o cenário competitivo. Esses eventos nos permitiram conhecer de perto diferentes comunidades, equipes e jogadores, além de entender as necessidades de quem participa e acompanha os esports.',
    },
    {
      numero: '02',
      texto:
        'Agora, ampliamos esse projeto também para o cenário online, permitindo que equipes de diferentes regiões possam participar das nossas competições sem precisar estar fisicamente em nossa estrutura.',
    },
    {
      virada: true,
      texto: 'E é nesse movimento que chegamos ao Overwatch.',
    },
    {
      numero: '03',
      texto:
        'Estamos abraçando a comunidade competitiva de Overwatch com um campeonato 100% online, pensado para reunir equipes de diferentes partes do Brasil e proporcionar uma experiência competitiva organizada, acessível e voltada para a integração do cenário nacional.',
    },
  ];
}
