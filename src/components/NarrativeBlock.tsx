import { stripStateUpdate } from '../engine/api';

interface NarrativeBlockProps {
  playerAction: string;
  narration: string;
  streaming: boolean;
}

/**
 * Strips STATE_UPDATE tags fully, and also removes any partially-arrived
 * tag fragments during streaming.
 */
function cleanNarrationText(text: string, isStreaming: boolean): string {
  let clean = stripStateUpdate(text);
  
  if (isStreaming) {
    clean = clean.replace(/<STATE_UPDATE>[\s\S]*$/g, '');
    clean = clean.replace(/<STATE[\s\S]*$/g, '');
    clean = clean.replace(/<S[\s\S]*$/g, '');
  }
  
  return clean.trim();
}

/**
 * Parses narration text into segments of normal text and NPC dialogue.
 * Handles multiple AI output formats for dialogue:
 *   *'dialogue'*   **'dialogue'**   *"dialogue"*   **"dialogue"**
 */
interface TextSegment {
  type: 'narration' | 'dialogue';
  text: string;
}

function parseNarration(text: string): TextSegment[] {
  if (!text) return [];
  
  // Strategy: match dialogue wrapped in asterisks + quotes.
  // Critical: the CLOSING quote must be followed by asterisk(s),
  // so apostrophes inside words (it's, don't, he'll) are NOT
  // treated as closing delimiters. The backreference \1 ensures
  // the same quote character opens and closes.
  //
  // Matched patterns:
  //   *'dialogue here'*       **'dialogue here'**
  //   *"dialogue here"*       **"dialogue here"**
  //   *'it's worth more,'*    (apostrophe inside is safe)
  
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  
  const dialogueRegex = /\*{1,2}(['"])([\s\S]*?)\1\*{1,2}/g;
  let match: RegExpExecArray | null;
  
  while ((match = dialogueRegex.exec(text)) !== null) {
    // Add narration text before this dialogue
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      if (before.trim()) {
        segments.push({ type: 'narration', text: before });
      }
    }
    
    // match[2] is the dialogue content between the quotes
    const dialogue = match[2].trim();
    
    if (dialogue) {
      segments.push({ type: 'dialogue', text: dialogue });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining narration after the last dialogue
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining.trim()) {
      segments.push({ type: 'narration', text: remaining });
    }
  }
  
  // If no dialogue found at all, return everything as narration
  if (segments.length === 0 && text.trim()) {
    segments.push({ type: 'narration', text });
  }
  
  return segments;
}

export function NarrativeBlock({ playerAction, narration, streaming }: NarrativeBlockProps) {
  const cleanNarration = cleanNarrationText(narration, streaming);
  const segments = parseNarration(cleanNarration);
  
  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {/* Player Action */}
      <div className="flex items-start gap-3">
        <span className="text-[#7a5af0] font-mono text-sm mt-0.5 font-bold">›</span>
        <div className="flex-1 border-l-2 pl-3" style={{ borderColor: 'rgba(122, 90, 240, 0.4)' }}>
          <p className="text-dungeon-blue font-mono text-[13px] italic leading-relaxed">
            {playerAction}
          </p>
        </div>
      </div>
      
      {/* DM Narration */}
      {cleanNarration && (
        <div className="font-serif text-[15px] leading-[1.85] text-dungeon-text pl-6">
          {segments.map((segment, idx) => {
            if (segment.type === 'dialogue') {
              return (
                <span 
                  key={idx} 
                  className="block border-l-2 pl-3 my-2 italic"
                  style={{ borderColor: 'rgba(212, 168, 74, 0.5)', color: '#e8c860' }}
                >
                  &lsquo;{segment.text}&rsquo;
                </span>
              );
            }
            return <span key={idx}>{segment.text}</span>;
          })}
          
          {/* Streaming cursor */}
          {streaming && (
            <span 
              className="inline-block w-[7px] h-[15px] rounded-[2px] ml-1.5 animate-blink align-middle"
              style={{ background: 'linear-gradient(180deg, #7a5af0, #c0b4d4)' }}
            />
          )}
        </div>
      )}
    </div>
  );
}
