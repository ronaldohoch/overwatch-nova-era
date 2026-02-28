import { Injectable } from '@angular/core';

/** Mapeamento de seed → teamId para o preview antes de gerar o bracket. */
export interface SeedPreview {
  readonly maxTeams: number;
  /** seedNumber (1-based) → teamId */
  readonly seedMap: Readonly<Record<number, string>>;
  /** Posições de seed ainda disponíveis, em ordem crescente */
  readonly availableSeeds: readonly number[];
}

/**
 * Serviço de seeding para o preview interativo da chave.
 *
 * Implementa o mesmo algoritmo Fisher-Yates do backend para que o admin
 * visualize em tempo real como ficará o chaveamento antes de confirmar.
 *
 * Todos os métodos são puros (não mutam o preview recebido).
 */
@Injectable({ providedIn: 'root' })
export class BracketSeedingService {
  /** Cria um preview vazio com todos os seeds disponíveis. */
  createEmpty(maxTeams: number): SeedPreview {
    const availableSeeds = Array.from({ length: maxTeams }, (_, i) => i + 1);
    return { maxTeams, seedMap: {}, availableSeeds };
  }

  /**
   * Atribui o time a uma posição **aleatória** disponível.
   * Utiliza Fisher-Yates para escolher entre as posições livres.
   */
  assignRandom(preview: SeedPreview, teamId: string): SeedPreview {
    const available = [...preview.availableSeeds];
    if (available.length === 0) return preview;

    // Fisher-Yates: sorteia índice aleatório entre os disponíveis
    const idx = Math.floor(Math.random() * available.length);
    const chosenSeed = available[idx];

    return this._assign(preview, teamId, chosenSeed);
  }

  /**
   * Atribui o time à **próxima posição sequencial** disponível (seed mais baixo).
   */
  assignManual(preview: SeedPreview, teamId: string): SeedPreview {
    const available = [...preview.availableSeeds];
    if (available.length === 0) return preview;

    // Próximo seed sequencial = menor disponível (já ordenado)
    const chosenSeed = available[0];

    return this._assign(preview, teamId, chosenSeed);
  }

  /** Remove um time do preview e libera seu slot de seed. */
  removeTeam(preview: SeedPreview, teamId: string): SeedPreview {
    const entry = Object.entries(preview.seedMap).find(([, id]) => id === teamId);
    if (!entry) return preview;

    const seedNumber = Number(entry[0]);
    // Desestrutura removendo apenas o seed liberado
    const { [seedNumber]: _removed, ...remaining } = preview.seedMap as Record<number, string>;

    const newAvailable = [...preview.availableSeeds, seedNumber].sort((a, b) => a - b);

    return {
      ...preview,
      seedMap: remaining as Record<number, string>,
      availableSeeds: newAvailable,
    };
  }

  /**
   * Retorna os teamIds em ordem de seed (seed 1 = índice 0, seed N = índice N-1).
   * Só inclui seeds já atribuídos.
   */
  getOrderedTeamIds(preview: SeedPreview): string[] {
    return Object.entries(preview.seedMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, teamId]) => teamId);
  }

  /** Reconstrói o preview para um novo modo mantendo os times selecionados. */
  rebuildForMode(
    preview: SeedPreview,
    mode: 'random' | 'manual',
    selectedTeamIds: readonly string[],
  ): SeedPreview {
    let rebuilt = this.createEmpty(preview.maxTeams);
    for (const teamId of selectedTeamIds) {
      rebuilt =
        mode === 'random'
          ? this.assignRandom(rebuilt, teamId)
          : this.assignManual(rebuilt, teamId);
    }
    return rebuilt;
  }

  // ── Privado ───────────────────────────────────────────────

  private _assign(preview: SeedPreview, teamId: string, seedNumber: number): SeedPreview {
    const newSeedMap = { ...preview.seedMap, [seedNumber]: teamId };
    const newAvailable = preview.availableSeeds.filter((s) => s !== seedNumber);
    return { ...preview, seedMap: newSeedMap, availableSeeds: newAvailable };
  }
}
