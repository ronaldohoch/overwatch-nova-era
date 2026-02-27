import { TeamCategory } from './team-category.type';

export interface StoredTeam {
  readonly name: string;
  readonly description: string | null;
  readonly groupLink: string | null;
  readonly tag: string | null;
  readonly category: TeamCategory;
  readonly captainUid: string | null;
  readonly createdByUid: string;
  readonly membersCount: number;
  readonly logoPath?: string | null;
  readonly logoBucketName?: string | null;
  readonly logoMimeType?: string | null;
  readonly logoUpdatedAt?: string | FirebaseFirestore.FieldValue | null;
  readonly createdAt: string;
  readonly updatedAt: string | FirebaseFirestore.FieldValue;
  readonly trophies: readonly unknown[];
}
