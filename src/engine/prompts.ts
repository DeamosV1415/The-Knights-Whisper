import type { WorldState, TurnEntry } from './worldState';

/**
 * Maximum number of past turns to include in conversation history.
 * Reduced from 20 (Groq) to 8 for smaller on-device model context windows.
 */
export const MAX_HISTORY_TURNS = 8;

/**
 * Builds the narrator system prompt (identity, voice rules, mechanics).
 * This is passed as the `systemPrompt` option to RunAnywhere's TextGeneration,
 * or as the system message for the Groq fallback.
 *
 * NOTE: World state is NOT included here — it goes into the user prompt
 * so the model can reference it alongside conversation history.
 */
export function buildSystemPrompt(): string {
  return `You are the narrator of a dark medieval dungeon crawler called Whisper World. You are an invisible author — omniscient, atmospheric, precise. You never speak to the player directly. You narrate what happens in the world as a consequence of their action.

VOICE RULES:
- Write in second person present tense: "The guard turns slowly."
- Pure story prose only. Never say "Great choice!" or "I'll handle that."
- Never break character. Never refuse an action.
- If an action is impossible or anachronistic, absorb it into the world with consequences.
- Keep each narration between 3 and 6 sentences. Dense, atmospheric, purposeful.
- End each narration in a state of tension or open possibility — never wrap things up neatly.
- Dialogue from NPCs goes in single quotes and italics: *'Like this.'*
- Use NPC names sparingly. Prefer physical description.

MECHANICS:
- Player health: track damage from combat. A hard hit costs 15-25 HP, a minor wound 5-10. Death at 0.
- Gold: deduct when player pays. NPCs have set prices (merchant: salve 8g, smoke powder 6g, poison 10g).
- Inventory: add items when player picks them up or buys them.
- NPC dispositions shift based on player actions. A bribed NPC becomes allied. A threatened NPC becomes fearful or hostile.
- dungeonOnAlert becomes true if combat breaks out at the entrance or if the player causes a loud disturbance.
- The artifact is in the final chamber (deepest part of the dungeon). Player wins by reaching it.
- If health reaches 0, narrate the player's death vividly and end the game.
- The name "Crow" is a secret — only the merchant knows it, and only if the player pays him.

After your narration, on a new line, output a JSON block between <STATE_UPDATE> and </STATE_UPDATE> tags with ONLY the fields that changed. Example:
<STATE_UPDATE>
{"player":{"gold":7},"npcs":{"merchant":{"disposition":"allied","knownFacts":["paid by player"]}},"flags":{"merchantPaid":true}}
</STATE_UPDATE>

If nothing changed, output <STATE_UPDATE>{}</STATE_UPDATE>.`;
}

/**
 * Strips STATE_UPDATE tags from narration text so we don't
 * waste context tokens when embedding history.
 */
function stripStateUpdate(text: string): string {
  return text.replace(/<STATE_UPDATE>[\s\S]*?<\/STATE_UPDATE>/g, '').trim();
}

/**
 * Builds the full user prompt with embedded world state,
 * conversation history, and current action.
 *
 * For RunAnywhere this is the `prompt` string.
 * For Groq fallback this is converted into message arrays.
 */
export function buildConversationPrompt(
  worldState: WorldState,
  pastTurns: TurnEntry[],
  currentAction: string
): string {
  const parts: string[] = [];

  // World state — authoritative, included every turn
  parts.push(`CURRENT WORLD STATE:\n${JSON.stringify(worldState, null, 2)}`);

  // Conversation history (capped)
  const recentTurns = pastTurns.slice(-MAX_HISTORY_TURNS);
  if (recentTurns.length > 0) {
    parts.push('\n### Conversation History:');
    for (const turn of recentTurns) {
      parts.push(`Player: "${turn.playerAction}"`);
      if (turn.narration) {
        const cleanNarration = stripStateUpdate(turn.narration).trim();
        if (cleanNarration) {
          parts.push(`Narrator: "${cleanNarration}"`);
        }
      }
    }
  }

  // Current action
  parts.push(`\n### Current Action:\nPlayer: "${currentAction}"`);
  parts.push('\nNarrate what happens next. Then output the STATE_UPDATE JSON.');

  return parts.join('\n');
}

/**
 * Builds the Groq-compatible messages array for the fallback path.
 * Preserves the original multi-turn message format that Groq expects.
 */
export function buildGroqMessages(
  worldState: WorldState,
  pastTurns: TurnEntry[],
  currentAction: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  // For Groq, we use the full system prompt with world state embedded (original approach)
  const systemPrompt = buildSystemPrompt() +
    `\n\nWORLD STATE (current, authoritative — use this every turn):\n${JSON.stringify(worldState, null, 2)}`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // Include recent conversation history (use same cap)
  const recentTurns = pastTurns.slice(-MAX_HISTORY_TURNS);
  for (const turn of recentTurns) {
    messages.push({ role: 'user', content: turn.playerAction });
    if (turn.narration) {
      const cleanNarration = stripStateUpdate(turn.narration).trim();
      if (cleanNarration) {
        messages.push({ role: 'assistant', content: cleanNarration });
      }
    }
  }

  messages.push({ role: 'user', content: currentAction });
  return messages;
}
