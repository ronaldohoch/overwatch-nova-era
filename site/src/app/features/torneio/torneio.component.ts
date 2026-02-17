import { Component, signal } from '@angular/core';
import { TorneioItemComponent } from './components/torneio-item/torneio-item.component';
import { MatchFormat } from './enums/match-format';
import { PodiumComponent } from './components/podium/podium.component';

export interface Member{
  name:string;
  battletag:string;
}

export interface Team{
  title:string;
  members:readonly Member[]
}

export interface MatchScore {
  teamA: number;
  teamB: number;
}

export interface Match{
  id?:string;
  format: MatchFormat;
  data:string;
  teamA:Team;
  teamB:Team;
  winnerTeamId:string;

  score: MatchScore; // opcional enquanto não jogou
  winner?: 'A' | 'B'; // opcional enquanto não jogou
}

export interface Tournament{
  title:string;
  teams: readonly Team[];
  matches: readonly Match[];
}

@Component({
  selector: 'app-torneio',
  imports: [TorneioItemComponent, PodiumComponent],
  templateUrl: './torneio.component.html',
  styleUrl: './torneio.component.css',
})
export class TorneioComponent {

quartas = signal<Tournament>({
  "title": "Nova Era — Double Elimination (8 times)",
  "teams": [
    {
      "title": "Time 1",
      "members": [
        { "name": "Ronaldo", "battletag": "Ronaldo#1029" },
        { "name": "Victor", "battletag": "Victor#4412" },
        { "name": "Lia", "battletag": "Lia#8831" },
        { "name": "Mendes", "battletag": "Mendes#2190" },
        { "name": "Nina", "battletag": "Nina#7003" }
      ]
    },
    {
      "title": "Time 2",
      "members": [
        { "name": "Bruno", "battletag": "Bruno#5544" },
        { "name": "Paula", "battletag": "Paula#1322" },
        { "name": "Caio", "battletag": "Caio#9911" },
        { "name": "Bia", "battletag": "Bia#8420" },
        { "name": "Igor", "battletag": "Igor#3001" }
      ]
    },
    {
      "title": "Time 3",
      "members": [
        { "name": "Duda", "battletag": "Duda#7777" },
        { "name": "Renan", "battletag": "Renan#1010" },
        { "name": "Fabi", "battletag": "Fabi#3333" },
        { "name": "João", "battletag": "Joao#6060" },
        { "name": "Cris", "battletag": "Cris#9090" }
      ]
    },
    {
      "title": "Time 4",
      "members": [
        { "name": "Gabi", "battletag": "Gabi#2020" },
        { "name": "Leo", "battletag": "Leo#8080" },
        { "name": "Tati", "battletag": "Tati#4545" },
        { "name": "Rafa", "battletag": "Rafa#1212" },
        { "name": "Gui", "battletag": "Gui#6767" }
      ]
    },
    {
      "title": "Time 5",
      "members": [
        { "name": "Nando", "battletag": "Nando#9898" },
        { "name": "Sara", "battletag": "Sara#2222" },
        { "name": "Vini", "battletag": "Vini#3131" },
        { "name": "Mari", "battletag": "Mari#4040" },
        { "name": "Luiz", "battletag": "Luiz#5151" }
      ]
    },
    {
      "title": "Time 6",
      "members": [
        { "name": "Aline", "battletag": "Aline#1414" },
        { "name": "Pedro", "battletag": "Pedro#2323" },
        { "name": "Ivy", "battletag": "Ivy#3434" },
        { "name": "Diego", "battletag": "Diego#5656" },
        { "name": "Yas", "battletag": "Yas#7878" }
      ]
    },
    {
      "title": "Time 7",
      "members": [
        { "name": "Nico", "battletag": "Nico#9091" },
        { "name": "Pri", "battletag": "Pri#1122" },
        { "name": "Ruan", "battletag": "Ruan#3344" },
        { "name": "Kadu", "battletag": "Kadu#5566" },
        { "name": "Mika", "battletag": "Mika#7788" }
      ]
    },
    {
      "title": "Time 8",
      "members": [
        { "name": "Luan", "battletag": "Luan#9191" },
        { "name": "Ana", "battletag": "Ana#1818" },
        { "name": "Pablo", "battletag": "Pablo#2727" },
        { "name": "Carol", "battletag": "Carol#3636" },
        { "name": "Zeca", "battletag": "Zeca#4949" }
      ]
    }
  ],
  "matches": [
    {
      "format": MatchFormat.MD3,
      "data": "28 Fev",
      "teamA": { "title": "Time 1", "members": [] },
      "teamB": { "title": "Time 2", "members": [] },
      "winnerTeamId": "Time 1",
      "score": { "teamA": 2, "teamB": 0 },
      "winner": "A"
    },
    {
      "format": MatchFormat.MD3,
      "data": "28 Fev",
      "teamA": { "title": "Time 3", "members": [] },
      "teamB": { "title": "Time 4", "members": [] },
      "winnerTeamId": "Time 3",
      "score": { "teamA": 2, "teamB": 3 },
      "winner": "B"
    },
    {
      "format": MatchFormat.MD3,
      "data": "28 Fev",
      "teamA": { "title": "Time 5", "members": [] },
      "teamB": { "title": "Time 6", "members": [] },
      "winnerTeamId": "Time 5",
      "score": { "teamA": 2, "teamB": 1 },
      "winner": "A"
    },
    {
      "format": MatchFormat.MD3,
      "data": "28 Fev",
      "teamA": { "title": "Time 7", "members": [] },
      "teamB": { "title": "Time 8", "members": [] },
      "winnerTeamId": "Time 7",
      "score": { "teamA": 2, "teamB": 3 },
      "winner": "B"
    },
  ]
})

winnersBracketSemiFinals = signal<Tournament>( {
  title: 'Winners Bracket',
  teams: [
    { title: 'Time 1', members: [] },
    { title: 'Time 4', members: [] },
    { title: 'Time 5', members: [] },
    { title: 'Time 8', members: [] },
  ],
  matches: [
    {
      format: MatchFormat.MD5,
      data: '01 Mar',
      teamA: { title: 'Time 1', members: [] },
      teamB: { title: 'Time 4', members: [] },
      winnerTeamId: 'Time 1',
      score: { teamA: 4, teamB: 1 },
      winner: 'A'
    },
    {
      format: MatchFormat.MD5,
      data: '01 Mar',
      teamA: { title: 'Time 5', members: [] },
      teamB: { title: 'Time 8', members: [] },
      winnerTeamId: 'Time 833',
      score: { teamA: 0, teamB: 3 },
      winner: 'B'
    },
  ],
});

losersBracketSemiFinals = signal<Tournament>( {
  title: 'Losers Bracket',
  teams: [
    { title: 'Time 2', members: [] },
    { title: 'Time 3', members: [] },
    { title: 'Time 6', members: [] },
    { title: 'Time 7', members: [] },
  ],
  matches: [
    {
      format: MatchFormat.MD5,
      data: '01 Mar',
      teamA: { title: 'Time 2', members: [] },
      teamB: { title: 'Time 6', members: [] },
      winnerTeamId: '',
      score: { teamA: 0, teamB: 2 },
      winner: 'B'
    },
    {
      format: MatchFormat.MD5,
      data: '01 Mar',
      teamA: { title: 'Time 3', members: [] },
      teamB: { title: 'Time 7', members: [] },
      winnerTeamId: '',
      score: { teamA: 1, teamB: 0 },
      winner: 'A'
    },
  ],
});

winnersBracketFinals = signal<Tournament>( {
  title: 'Winners Bracket',
  teams: [
    { title: 'Time 1', members: [] },
    { title: 'Time 4', members: [] },
    { title: 'Time 5', members: [] },
    { title: 'Time 8', members: [] },
  ],
  matches: [
    {
      format: MatchFormat.MD7,
      data: '01 Mar',
      teamA: { title: 'Time 1', members: [] },
      teamB: { title: 'Time 8', members: [] },
      winnerTeamId: 'Time 8',
      score: { teamA: 1, teamB: 3 },
      winner: 'B'
    },
  ],
});

losersBracketFinals = signal<Tournament>( {
  title: 'Losers Bracket',
  teams: [
    { title: 'Time 2', members: [] },
    { title: 'Time 3', members: [] },
    { title: 'Time 6', members: [] },
    { title: 'Time 7', members: [] },
  ],
  matches: [
    {
      format: MatchFormat.MD7,
      data: '01 Mar',
      teamA: { title: 'Time 3', members: [] },
      teamB: { title: 'Time 6', members: [] },
      winnerTeamId: '',
      score: { teamA: 0, teamB: 3 },
      winner: 'B'
    },
  ],
});

thirdPlace = signal<Tournament>( {
  title: 'Losers Bracket',
  teams: [
    { title: 'Time 2', members: [] },
    { title: 'Time 3', members: [] },
    { title: 'Time 6', members: [] },
    { title: 'Time 7', members: [] },
  ],
  matches: [
    {
      format: MatchFormat.MD7,
      data: '01 Mar',
      teamA: { title: 'Time 1', members: [] },
      teamB: { title: 'Time 3', members: [] },
      winnerTeamId: '',
      score: { teamA: 2, teamB: 3 },
      winner: 'B'
    },
  ],
});

bigFinal = signal<Tournament>( {
  title: 'Losers Bracket',
  teams: [
    { title: 'Time 2', members: [] },
    { title: 'Time 3', members: [] },
    { title: 'Time 6', members: [] },
    { title: 'Time 7', members: [] },
  ],
  matches: [
    {
      format: MatchFormat.MD7,
      data: '01 Mar',
      teamA: { title: 'Time 8', members: [] },
      teamB: { title: 'Time 6', members: [] },
      winnerTeamId: '',
      score: { teamA: 2, teamB: 3 },
      winner: 'B'
    },
  ],
});


}
