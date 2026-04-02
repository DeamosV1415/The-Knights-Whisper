import { useState, useCallback, useRef } from 'react';
import type { WorldState } from '../engine/worldState';
import { deepMergeWorldState } from '../engine/worldState';
import { INITIAL_WORLD_STATE } from '../data/scenario';

/**
 * Describes a single change that occurred during a state update.
 */
export interface StatChange {
  id: string;
  type: 'hp_damage' | 'hp_heal' | 'gold_spent' | 'gold_gained' | 'item_added' | 'item_removed' | 'npc_disposition' | 'npc_death' | 'location' | 'flag';
  label: string;
  emoji: string;
  color: string;
}

/**
 * Diffs old and new world states to produce human-readable change events.
 */
function diffWorldState(oldState: WorldState, newState: WorldState): StatChange[] {
  const changes: StatChange[] = [];
  const id = () => `change-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // HP changes
  const hpDelta = newState.player.health - oldState.player.health;
  if (hpDelta < 0) {
    changes.push({
      id: id(), type: 'hp_damage',
      label: `${hpDelta} HP`,
      emoji: '💔', color: '#e05050',
    });
  } else if (hpDelta > 0) {
    changes.push({
      id: id(), type: 'hp_heal',
      label: `+${hpDelta} HP`,
      emoji: '💚', color: '#50c870',
    });
  }

  // Gold changes
  const goldDelta = newState.player.gold - oldState.player.gold;
  if (goldDelta < 0) {
    changes.push({
      id: id(), type: 'gold_spent',
      label: `${goldDelta}g`,
      emoji: '🪙', color: '#c0a040',
    });
  } else if (goldDelta > 0) {
    changes.push({
      id: id(), type: 'gold_gained',
      label: `+${goldDelta}g`,
      emoji: '🪙', color: '#e8c860',
    });
  }

  // Inventory additions
  const oldInv = new Set(oldState.player.inventory);
  const newInv = new Set(newState.player.inventory);
  for (const item of newState.player.inventory) {
    if (!oldInv.has(item)) {
      changes.push({
        id: id(), type: 'item_added',
        label: `${item}`,
        emoji: '🎒', color: '#8a7ab0',
      });
    }
  }
  for (const item of oldState.player.inventory) {
    if (!newInv.has(item)) {
      changes.push({
        id: id(), type: 'item_removed',
        label: `Lost ${item}`,
        emoji: '💨', color: '#6a5a8a',
      });
    }
  }

  // NPC disposition changes
  for (const npcId in newState.npcs) {
    const oldNpc = oldState.npcs[npcId];
    const newNpc = newState.npcs[npcId];
    if (!oldNpc) continue;

    if (oldNpc.disposition !== newNpc.disposition) {
      if (newNpc.disposition === 'dead') {
        changes.push({
          id: id(), type: 'npc_death',
          label: `${newNpc.name} killed`,
          emoji: '💀', color: '#8a6090',
        });
      } else {
        changes.push({
          id: id(), type: 'npc_disposition',
          label: `${newNpc.name} → ${newNpc.disposition.toUpperCase()}`,
          emoji: newNpc.disposition === 'hostile' ? '⚔️' :
                 newNpc.disposition === 'allied' ? '🤝' :
                 newNpc.disposition === 'fearful' ? '😨' :
                 newNpc.disposition === 'wary' ? '👀' : '🔄',
          color: newNpc.disposition === 'hostile' ? '#e05050' :
                 newNpc.disposition === 'allied' ? '#50c870' :
                 newNpc.disposition === 'fearful' ? '#c09030' :
                 newNpc.disposition === 'wary' ? '#c09030' : '#8a7ab0',
        });
      }
    }
  }

  // Location change
  if (oldState.player.location !== newState.player.location) {
    changes.push({
      id: id(), type: 'location',
      label: newState.player.location,
      emoji: '📍', color: '#7a9ac0',
    });
  }

  return changes;
}

/**
 * Custom hook that manages world state and emits change events
 * whenever State_UPDATE patches arrive from the AI.
 */
export function useWorldState() {
  const [worldState, setWorldState] = useState<WorldState>(INITIAL_WORLD_STATE);
  const [changes, setChanges] = useState<StatChange[]>([]);
  const prevStateRef = useRef<WorldState>(INITIAL_WORLD_STATE);

  /** Merge a patch into world state and emit change events */
  const applyPatch = useCallback((patch: Partial<WorldState>) => {
    setWorldState(prev => {
      const next = deepMergeWorldState(prev, patch);
      
      // Diff and produce change events
      const newChanges = diffWorldState(prev, next);
      if (newChanges.length > 0) {
        setChanges(current => [...current, ...newChanges]);
      }
      
      prevStateRef.current = next;
      return next;
    });
  }, []);

  /** Remove a change from the active list (after toast dismissal) */
  const dismissChange = useCallback((changeId: string) => {
    setChanges(prev => prev.filter(c => c.id !== changeId));
  }, []);

  /** Reset everything back to initial state */
  const reset = useCallback(() => {
    setWorldState(INITIAL_WORLD_STATE);
    setChanges([]);
    prevStateRef.current = INITIAL_WORLD_STATE;
  }, []);

  return {
    worldState,
    changes,
    applyPatch,
    dismissChange,
    reset,
  };
}
