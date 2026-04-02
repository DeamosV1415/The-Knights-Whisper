import type { WorldState } from '../engine/worldState';

export const NPC_LORE = {
  merchant: "A wiry man who trades information as much as goods. He is cautious, motivated by survival and coin. He knows the name Crow — the local crime lord who controls the dungeon's interior — but only shares it if paid. He sells: healing salve (8g), smoke powder (6g, blinds enemies briefly), blade poison (10g). He also knows about a dead soldier 30 paces inside the first corridor whose sword is still sheathed.",
  leftGuard: "The dominant of the two guards. Bored, dangerous, competent. He owes significant gambling debts to Crow. Hearing the name Crow from a stranger unsettles him — it implies connections. He can be bribed (10g) or manipulated using the Crow debt. If the dungeon goes on alert, he becomes hostile.",
  rightGuard: "Passive follower. Takes cues from the left guard entirely. If the left guard is neutralized (bribed, dead, distracted), the right guard becomes confused and easier to bypass.",
  dagger: "A weapons trader who operates inside the dungeon on Crow's behalf. He never approaches first unless he wants something from the player. He has a short sword (15g), a crossbow (20g), and bolts (5g each). He is neutral toward the player unless threatened. He knows the layout of the deeper dungeon.",
};

export const INITIAL_WORLD_STATE: WorldState = {
  player: {
    health: 100,
    maxHealth: 100,
    gold: 15,
    inventory: [],
    location: 'Tomb of Ashkar — Entrance',
  },
  npcs: {
    merchant: {
      id: 'merchant',
      name: 'Merchant',
      disposition: 'neutral',
      alive: true,
      knownFacts: [],
      location: 'entrance',
    },
    leftGuard: {
      id: 'leftGuard',
      name: 'Left Guard',
      disposition: 'neutral',
      alive: true,
      knownFacts: [],
      location: 'entrance',
    },
    rightGuard: {
      id: 'rightGuard',
      name: 'Right Guard',
      disposition: 'neutral',
      alive: true,
      knownFacts: [],
      location: 'entrance',
    },
    dagger: {
      id: 'dagger',
      name: 'Dagger',
      disposition: 'unknown',
      alive: true,
      knownFacts: [],
      location: 'inside',
    },
  },
  flags: {
    dungeonOnAlert: false,
    crowNameKnown: false,
    daggerMetPlayer: false,
    soldierSwordTaken: false,
    merchantPaid: false,
    leftGuardBribed: false,
    rightGuardBribed: false,
    artifactRetrieved: false,
    gamePhase: 'entrance',
    endingType: null,
  },
  turnCount: 0,
};

export const OPENING_SCENE = `You stand at the entrance of the Tomb of Ashkar. A hooded merchant crouches near a sputtering torch, counting coins with nervous fingers. Two guards in rust-eaten armor block the iron gate ahead, muttering to each other. The air smells of damp stone and old death. Somewhere deep inside, something shifts.`;
