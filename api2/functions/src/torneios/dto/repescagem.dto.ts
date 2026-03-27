export type RepescagemRole = 'flex' | 'tank' | 'dps' | 'support';

export interface SetRepescagemDto {
  role: RepescagemRole;
  slots: number;
}

export interface RepescagemCheckinDto {
  role?: 'tank' | 'dps' | 'support';
}
