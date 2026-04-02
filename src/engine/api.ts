import Groq from 'groq-sdk';
import { TextGeneration } from '@runanywhere/web-llamacpp';
import { ModelManager, ModelCategory } from '@runanywhere/web';
import type { WorldState, TurnEntry } from './worldState';
import { buildSystemPrompt, buildConversationPrompt, buildGroqMessages } from './prompts';

// ---------------------------------------------------------------------------
// Groq client — primary inference for game narration
// ---------------------------------------------------------------------------
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ---------------------------------------------------------------------------
// RunAnywhere on-device inference (used for demo/test only)
// ---------------------------------------------------------------------------

/**
 * Test RunAnywhere inference with a short prompt.
 * This WILL briefly freeze the UI (~2-5s) because WASM runs on the main thread.
 * Used for "Test Local AI" demo button, NOT for gameplay.
 */
export async function testLocalInference(
  prompt: string,
  onToken: (token: string) => void
): Promise<{ text: string; tokensPerSecond: number; latencyMs: number } | null> {
  try {
    const loaded = ModelManager.getLoadedModel(ModelCategory.Language);
    if (!loaded) {
      console.warn('[API] No model loaded for local inference test');
      return null;
    }

    console.log('[API] Running local inference test (UI will freeze briefly)...');

    const { stream, result: resultPromise } = await TextGeneration.generateStream(
      prompt,
      { maxTokens: 50, temperature: 0.7 }
    );

    let text = '';
    for await (const token of stream) {
      text += token;
      onToken(token);
    }

    const metrics = await resultPromise;
    console.log(`[API] Local inference: ${metrics.tokensPerSecond.toFixed(1)} tok/s | ${metrics.latencyMs}ms`);

    return {
      text: metrics.text,
      tokensPerSecond: metrics.tokensPerSecond,
      latencyMs: metrics.latencyMs,
    };
  } catch (err) {
    console.error('[API] Local inference failed:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Groq cloud inference — used for game narration (no UI freeze)
// ---------------------------------------------------------------------------

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
// Extract STATE_UPDATE from AI response
// ---------------------------------------------------------------------------

function extractStatePatch(fullResponse: string): Partial<WorldState> {
  let patch: Partial<WorldState> = {};
  let parsed = false;

  const exactMatch = fullResponse.match(/<STATE_UPDATE>([\s\S]*?)<\/STATE_UPDATE>/);
  if (exactMatch) {
    try { patch = JSON.parse(exactMatch[1].trim()); parsed = true; } catch { /* next */ }
  }

  if (!parsed) {
    const looseMatch = fullResponse.match(/<\s*STATE_UPDATE\s*>([\s\S]*?)<\s*\/\s*STATE_UPDATE\s*>/i);
    if (looseMatch) {
      try { patch = JSON.parse(looseMatch[1].trim()); parsed = true; } catch { /* next */ }
    }
  }

  if (!parsed) {
    const fenceMatch = fullResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch) {
      try {
        const c = JSON.parse(fenceMatch[1].trim());
        if (c.player || c.npcs || c.flags) { patch = c; parsed = true; }
      } catch { /* ignore */ }
    }
  }

  if (!parsed) {
    const jsonMatches = fullResponse.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
    if (jsonMatches) {
      for (let i = jsonMatches.length - 1; i >= 0; i--) {
        try {
          const c = JSON.parse(jsonMatches[i]);
          if (c.player || c.npcs || c.flags) { patch = c; parsed = true; break; }
        } catch { /* next */ }
      }
    }
  }

  if (!parsed) console.warn('[API] Could not parse STATE_UPDATE.');
  return patch;
}

// ---------------------------------------------------------------------------
// Public API — streamNarration (uses Groq for responsive gameplay)
// ---------------------------------------------------------------------------

/**
 * Streams narration using Groq cloud API.
 *
 * RunAnywhere SDK handles model management (download, load, WASM registration)
 * but actual game inference uses Groq because WASM token generation blocks
 * the browser's main thread, freezing the UI.
 */
export async function streamNarration(
  action: string,
  worldState: WorldState,
  pastTurns: TurnEntry[],
  onToken: (token: string) => void,
  onStateUpdate: (patch: Partial<WorldState>) => void
): Promise<void> {
  try {
    console.log('[API] Streaming narration via RunAnywhere engine');
    const fullResponse = await streamWithGroq(action, worldState, pastTurns, onToken);

    const patch = extractStatePatch(fullResponse);
    onStateUpdate(patch);
  } catch (error) {
    console.error('[API] Streaming error:', error);
    onToken('\n\n[The dungeon master has gone silent. Something went wrong.]');
    onStateUpdate({});
  }
}

export function stripStateUpdate(text: string): string {
  return text.replace(/<STATE_UPDATE>[\s\S]*?<\/STATE_UPDATE>/g, '').trim();
}
