import Groq from 'groq-sdk';
import type { WorldState, TurnEntry } from './worldState';
import { deepMergeWorldState } from './worldState';
import { buildSystemPrompt } from './prompts';

const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY, 
  dangerouslyAllowBrowser: true 
});

/** Maximum number of past turns to include in conversation history */
const MAX_HISTORY_TURNS = 20;

/**
 * Builds the messages array with conversation history so the AI
 * remembers what has been said in previous turns.
 */
function buildMessages(
  systemPrompt: string,
  pastTurns: TurnEntry[],
  currentAction: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // Include recent conversation history (capped to save tokens)
  const recentTurns = pastTurns.slice(-MAX_HISTORY_TURNS);
  for (const turn of recentTurns) {
    // Player action
    messages.push({ role: 'user', content: turn.playerAction });

    // AI narration — strip STATE_UPDATE tags so we don't waste tokens
    if (turn.narration) {
      const cleanNarration = stripStateUpdate(turn.narration).trim();
      if (cleanNarration) {
        messages.push({ role: 'assistant', content: cleanNarration });
      }
    }
  }

  // Current player action
  messages.push({ role: 'user', content: currentAction });

  return messages;
}

/**
 * Streams narration from Groq AI, calling onToken for each word/token,
 * and onStateUpdate with parsed state changes when complete.
 */
export async function streamNarration(
  action: string,
  worldState: WorldState,
  pastTurns: TurnEntry[],
  onToken: (token: string) => void,
  onStateUpdate: (patch: Partial<WorldState>) => void
): Promise<void> {
  try {
    const systemPrompt = buildSystemPrompt(worldState);
    const messages = buildMessages(systemPrompt, pastTurns, action);
    
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      stream: true,
      max_tokens: 400,
      temperature: 0.8,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        fullResponse += token;
        onToken(token);
      }
    }

    // Extract STATE_UPDATE JSON — multi-strategy for robustness
    let patch: Partial<WorldState> = {};
    let parsed = false;

    // Strategy 1: Exact tag match
    const exactMatch = fullResponse.match(/<STATE_UPDATE>([\s\S]*?)<\/STATE_UPDATE>/);
    if (exactMatch) {
      try {
        patch = JSON.parse(exactMatch[1].trim());
        parsed = true;
      } catch { /* try next strategy */ }
    }

    // Strategy 2: Case-insensitive / whitespace-tolerant tags
    if (!parsed) {
      const looseMatch = fullResponse.match(/<\s*STATE_UPDATE\s*>([\s\S]*?)<\s*\/\s*STATE_UPDATE\s*>/i);
      if (looseMatch) {
        try {
          patch = JSON.parse(looseMatch[1].trim());
          parsed = true;
        } catch { /* try next strategy */ }
      }
    }

    // Strategy 3: JSON block in markdown code fence after narration
    if (!parsed) {
      const fenceMatch = fullResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (fenceMatch) {
        try {
          const candidate = JSON.parse(fenceMatch[1].trim());
          // Only accept if it looks like a WorldState patch (has player/npcs/flags keys)
          if (candidate.player || candidate.npcs || candidate.flags) {
            patch = candidate;
            parsed = true;
          }
        } catch { /* ignore */ }
      }
    }

    // Strategy 4: Last JSON object in the response (common fallback)
    if (!parsed) {
      const jsonMatches = fullResponse.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      if (jsonMatches) {
        // Try the last JSON-like block (most likely the state update)
        for (let i = jsonMatches.length - 1; i >= 0; i--) {
          try {
            const candidate = JSON.parse(jsonMatches[i]);
            if (candidate.player || candidate.npcs || candidate.flags) {
              patch = candidate;
              parsed = true;
              break;
            }
          } catch { /* try previous match */ }
        }
      }
    }

    if (!parsed) {
      console.warn('Could not parse STATE_UPDATE from AI response. Narration-only turn.');
    }

    onStateUpdate(patch);

  } catch (error) {
    console.error('Groq streaming error:', error);
    onToken('\n\n[The dungeon master has gone silent. Something went wrong with the narration.]');
    onStateUpdate({});
  }
}

/**
 * Helper to strip STATE_UPDATE tags from displayed narration.
 */
export function stripStateUpdate(text: string): string {
  return text.replace(/<STATE_UPDATE>[\s\S]*?<\/STATE_UPDATE>/g, '').trim();
}
