import Groq from 'groq-sdk';
import { TextGeneration } from '@runanywhere/web-llamacpp';
import { ModelManager, ModelCategory } from '@runanywhere/web';
import type { WorldState, TurnEntry } from './worldState';
import { buildSystemPrompt, buildConversationPrompt, buildGroqMessages } from './prompts';

// ---------------------------------------------------------------------------
// Groq client (fallback)
// ---------------------------------------------------------------------------
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ---------------------------------------------------------------------------
// Timeout helper
// ---------------------------------------------------------------------------

/** Wraps a promise with a timeout. Rejects if the promise doesn't resolve in time. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

// ---------------------------------------------------------------------------
// RunAnywhere (primary) — on-device LLM via WASM/WebGPU
// ---------------------------------------------------------------------------

/**
 * Check whether the RunAnywhere LLM is loaded and ready for inference.
 */
function isRunAnywhereReady(): boolean {
  try {
    const loaded = ModelManager.getLoadedModel(ModelCategory.Language);
    return loaded !== null && loaded !== undefined;
  } catch {
    return false;
  }
}

/**
 * Streams narration using RunAnywhere's on-device TextGeneration.
 * Includes a 60-second timeout to prevent infinite hangs.
 */
async function streamWithRunAnywhere(
  action: string,
  worldState: WorldState,
  pastTurns: TurnEntry[],
  onToken: (token: string) => void
): Promise<string> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildConversationPrompt(worldState, pastTurns, action);

  // Wrap the entire streaming operation in a timeout
  const streamingPromise = (async () => {
    const { stream } = await TextGeneration.generateStream(userPrompt, {
      systemPrompt,
      maxTokens: 400,
      temperature: 0.8,
    });

    let fullResponse = '';
    for await (const token of stream) {
      fullResponse += token;
      onToken(token);
    }
    return fullResponse;
  })();

  return withTimeout(streamingPromise, 60_000, 'RunAnywhere inference');
}

// ---------------------------------------------------------------------------
// Groq (fallback) — cloud-based LLM
// ---------------------------------------------------------------------------

/**
 * Streams narration using Groq's cloud API as a fallback.
 */
async function streamWithGroq(
  action: string,
  worldState: WorldState,
  pastTurns: TurnEntry[],
  onToken: (token: string) => void
): Promise<string> {
  const messages = buildGroqMessages(worldState, pastTurns, action);

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

  return fullResponse;
}

// ---------------------------------------------------------------------------
// Extract STATE_UPDATE from AI response (multi-strategy, unchanged)
// ---------------------------------------------------------------------------

/**
 * Parses STATE_UPDATE JSON from the AI's response using multiple strategies.
 */
function extractStatePatch(fullResponse: string): Partial<WorldState> {
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
    console.warn('[API] Could not parse STATE_UPDATE from AI response. Narration-only turn.');
  }

  return patch;
}

// ---------------------------------------------------------------------------
// Public API — streamNarration (signature unchanged for GameScreen)
// ---------------------------------------------------------------------------

/**
 * Streams narration from the AI, calling onToken for each word/token,
 * and onStateUpdate with parsed state changes when complete.
 *
 * Primary: RunAnywhere on-device LLM (WASM/WebGPU)
 * Fallback: Groq cloud API (if on-device model is not loaded or fails)
 */
export async function streamNarration(
  action: string,
  worldState: WorldState,
  pastTurns: TurnEntry[],
  onToken: (token: string) => void,
  onStateUpdate: (patch: Partial<WorldState>) => void
): Promise<void> {
  try {
    let fullResponse: string;

    if (isRunAnywhereReady()) {
      console.log('[API] Using RunAnywhere on-device LLM');
      try {
        fullResponse = await streamWithRunAnywhere(action, worldState, pastTurns, onToken);
      } catch (raError) {
        console.warn('[API] RunAnywhere failed, falling back to Groq:', raError);
        // Reset any partial tokens the user might have seen before the error
        onToken('\n[Switching to cloud AI…]\n');
        fullResponse = await streamWithGroq(action, worldState, pastTurns, onToken);
      }
    } else {
      console.log('[API] RunAnywhere LLM not loaded, using Groq fallback');
      fullResponse = await streamWithGroq(action, worldState, pastTurns, onToken);
    }

    // Extract state patch (same logic regardless of backend)
    const patch = extractStatePatch(fullResponse);
    onStateUpdate(patch);

  } catch (error) {
    console.error('[API] Streaming error:', error);
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
