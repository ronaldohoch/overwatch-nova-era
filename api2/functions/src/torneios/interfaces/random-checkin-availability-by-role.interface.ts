import { RoleAvailability } from './role-availability.interface';

export interface RandomCheckinAvailabilityByRole {
  tournamentId: string;
  totals: RoleAvailability;
  roles: {
    tank: RoleAvailability;
    dps: RoleAvailability;
    support: RoleAvailability;
  };
}
