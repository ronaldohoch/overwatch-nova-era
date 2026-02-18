import { RoleSlotsPerTeamDto, TeamMode } from './create-torneio.dto';

export interface UpdateTorneioDto {
  name?: string;
  description?: string | null;

  // só pode alterar isso enquanto estiver draft (a service vai travar)
  teamMode?: TeamMode;
  maxTeams?: number;

  startAt?: string;           // ISO
  checkinDeadlineAt?: string; // ISO

  roleSlotsPerTeam?: RoleSlotsPerTeamDto;
}
