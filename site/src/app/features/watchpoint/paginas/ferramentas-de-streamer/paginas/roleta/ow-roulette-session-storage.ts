export type OwRouletteListItem = Readonly<{
  id: string;
  name: string;
  battletag?: string | null;
  displayName?: string | null;
}>;

export const OW_ROULETTE_SESSION_STORAGE_KEY = 'watchpoint:ow-roulette:list-items';
export const OW_ROULETTE_ROUTE = '/watchpoint/ferramentas-de-streamer/roleta';
