export type TeamMode = 'random' | 'closed';

export interface RoleSlotsPerTeamDto {
  tank: number;
  dps: number;
  support: number;
}

export interface CreateTorneioDto {
  name: string;
  description?: string | null;

  teamMode: TeamMode; // 'random' | 'closed'
  maxTeams: number;   // 4,8,16...

  // datas (aceita ISO no body)
  startAt: string;            // ISO
  checkinDeadlineAt: string;  // ISO

  // só no random (se não enviar, usa o padrão 2/3/3)
  roleSlotsPerTeam?: RoleSlotsPerTeamDto;
}
