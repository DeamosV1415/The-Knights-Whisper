export type Disposition = 'allied' | 'neutral' | 'cautious' | 'wary' | 'hostile' | 'fearful' | 'unknown' | 'dead';

export interface NPC {
  id: string;
  name: string;
  disposition: Disposition;
  alive: boolean;
  knownFacts: string[];   // facts the player has learned about this NPC
  location: 'entrance' | 'inside' | 'gone';
}

export interface PlayerState {
  health: number;
  maxHealth: number;
  gold: number;
  inventory: string[];
  location: string;
}

export interface WorldFlags {
  dungeonOnAlert: boolean;
  crowNameKnown: boolean;
  daggerMetPlayer: boolean;
  soldierSwordTaken: boolean;
  merchantPaid: boolean;
  leftGuardBribed: boolean;
  rightGuardBribed: boolean;
  artifactRetrieved: boolean;
  gamePhase: 'intro' | 'entrance' | 'corridor' | 'depths' | 'chamber' | 'ended';
  endingType: null | 'victory_combat' | 'victory_stealth' | 'victory_manipulation' | 'defeat_death' | 'defeat_collapse';
}

export interface WorldState {
  player: PlayerState;
  npcs: Record<string, NPC>;
  flags: WorldFlags;
  turnCount: number;
}

export interface TurnEntry {
  id: string;
  playerAction: string;
  narration: string;         // full streamed narration
  streaming: boolean;        // true while tokens are arriving
}

/**
 * Deep merge utility for world state updates.
 * Handles nested objects (player, npcs, flags) carefully.
 */
export function deepMergeWorldState(base: WorldState, patch: any): WorldState {
  const result: WorldState = JSON.parse(JSON.stringify(base)); // deep clone
  
  if (!patch) return result;
  
  // Merge player state
  if (patch.player) {
    result.player = { ...result.player, ...patch.player };
  }
  
  // Merge NPCs (field-by-field for each NPC)
  if (patch.npcs) {
    for (const npcId in patch.npcs) {
      if (result.npcs[npcId]) {
        result.npcs[npcId] = { 
          ...result.npcs[npcId], 
          ...patch.npcs[npcId] 
        };
      } else {
        result.npcs[npcId] = patch.npcs[npcId];
      }
    }
  }
  
  // Merge flags
  if (patch.flags) {
    result.flags = { ...result.flags, ...patch.flags };
  }
  
  // Merge turn count
  if (patch.turnCount !== undefined) {
    result.turnCount = patch.turnCount;
  }
  
  return result;
}
