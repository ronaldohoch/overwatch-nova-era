import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BadgeComponent } from '../../shared/design-system/badge/badge.component';
import { CardComponent } from '../../shared/card/card.component';
import { DividerComponent } from '../../shared/design-system/divider/divider.component';

type InfoGeral = Readonly<{ label: string; value: string }>;

type PremioLugar = Readonly<{
  titulo: string;
  itens: readonly string[];
  destaque: boolean;
}>;

type SecaoIndice = Readonly<{ id: string; titulo: string }>;

/**
 * Regulamento oficial do STG Overwatch Open.
 * O texto vem do documento oficial (docs/superpowers/specs/regras-torneio-stg.md)
 * e é reproduzido na íntegra, sem alterações de redação.
 */
@Component({
  selector: 'app-regras-stg',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, CardComponent, DividerComponent],
  templateUrl: './regras-stg.component.html',
})
export class RegrasStgComponent {
  readonly indice: readonly SecaoIndice[] = [
    { id: 'formato', titulo: 'Formato do Campeonato' },
    { id: 'informacoes', titulo: 'Informações Gerais' },
    { id: 'inscricao', titulo: 'Inscrição' },
    { id: 'premiacao', titulo: 'Premiação' },
    { id: 'regras-gerais', titulo: 'Regras Gerais' },
    { id: 'comunicacao', titulo: 'Comunicação' },
  ];

  readonly formatoOnline: readonly string[] = [
    'Os confrontos serão disputados em datas e horários definidos pela organização.',
    'As partidas serão agendadas dentro do período estabelecido para cada fase.',
    'A organização será responsável pela divulgação dos confrontos e horários.',
    'As equipes deverão estar disponíveis nos horários previamente definidos.',
    'Todas as partidas seguirão as configurações competitivas oficiais estabelecidas pela organização.',
  ];

  readonly fasesCompeticao: readonly string[] = [
    'O campeonato será dividido em fases eliminatórias, seguindo o formato definido pela organização de acordo com o número final de equipes inscritas.',
    'As equipes classificadas avançarão para as fases seguintes até chegarmos à Grande Final.',
    'Todas as partidas serão realizadas online, incluindo semifinal e final.',
  ];

  readonly informacoesGerais: readonly InfoGeral[] = [
    { label: 'Jogo', value: 'Overwatch 2' },
    { label: 'Plataforma', value: 'Multiplataforma (PC ou console)' },
    { label: 'Formato', value: 'Equipes de 5 jogadores' },
    { label: 'Reservas', value: 'Até 2 jogadores reservas por equipe' },
    { label: 'Modalidade', value: '100% Online' },
    { label: 'Formato das partidas', value: 'Conforme definido pela organização' },
    { label: 'Configurações', value: 'Competitivas oficiais' },
    { label: 'Comunicação oficial', value: 'Será realizada com o capitão/responsável pela equipe' },
  ];

  readonly inscricao: readonly string[] = [
    'O valor da inscrição permanece o mesmo divulgado na publicação oficial do campeonato, mesmo após a alteração para o formato 100% online.',
    'A vaga da equipe será considerada confirmada somente após a confirmação do pagamento pela organização.',
    'Após a confirmação da inscrição, a equipe receberá as orientações necessárias para participação no campeonato.',
  ];

  readonly premiacao: readonly PremioLugar[] = [
    {
      titulo: '🥇 Campeão',
      itens: ['Troféu', 'Medalhas', 'Brindes oficiais', 'Premiação em dinheiro'],
      destaque: true,
    },
    {
      titulo: '🥈 Vice-Campeão',
      itens: ['Medalhas', 'Brindes', 'Premiação em dinheiro'],
      destaque: false,
    },
    {
      titulo: '🥉 3º Lugar',
      itens: ['Medalhas', 'Brindes'],
      destaque: false,
    },
  ];

  readonly regrasGerais: readonly string[] = [
    'Todos os participantes deverão agir com respeito com a organização, adversários e demais participantes.',
    'É proibido qualquer tipo de trapaça, uso de programas ilegais, exploits ou ferramentas que proporcionem vantagem indevida.',
    'A organização poderá solicitar comprovação de identidade dos participantes a qualquer momento.',
    'O capitão/responsável pela equipe será o principal contato com a organização e ficará responsável pela comunicação oficial da equipe.',
    'A equipe deverá estar disponível no dia e horário previamente agendados para sua partida.',
    'Haverá tolerância máxima de 10 minutos para o início da partida.',
    'O não comparecimento da equipe dentro do período de tolerância poderá resultar em W.O.',
    'Problemas técnicos individuais dos jogadores não serão considerados automaticamente como justificativa para o atraso ou ausência da equipe.',
    'É responsabilidade das equipes garantir uma conexão de internet adequada e as condições necessárias para disputar as partidas.',
    'A organização poderá solicitar provas, registros ou informações relacionadas a partidas em caso de denúncias ou situações controversas.',
    'A organização possui autonomia para interpretar e decidir sobre situações não previstas neste regulamento, buscando sempre preservar a competitividade e a integridade do campeonato.',
  ];

  readonly comunicacaoItens: readonly string[] = [
    'Tabelas;',
    'Confrontos;',
    'Horários;',
    'Resultados;',
    'Comunicados;',
    'Alterações;',
    'Orientações para as partidas;',
  ];
}
