import { KnockoutFormat, RoleSlotsPerTeamDto, TeamMode, TournamentFormat } from './create-torneio.dto';

export interface UpdateTorneioDto {
  name?: string;
  description?: string | null;

  // só pode alterar isso enquanto estiver draft (a service vai travar)
  teamMode?: TeamMode;
  maxTeams?: number;
  format?: TournamentFormat;
  knockoutFormat?: KnockoutFormat;

  startAt?: string;           // ISO
  checkinDeadlineAt?: string; // ISO

  roleSlotsPerTeam?: RoleSlotsPerTeamDto;
}
