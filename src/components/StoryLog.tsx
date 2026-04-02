import { useEffect, useRef } from 'react';
import type { TurnEntry } from '../engine/worldState';
import { NarrativeBlock } from './NarrativeBlock';

interface StoryLogProps {
  turns: TurnEntry[];
}

export function StoryLog({ turns }: StoryLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);
  
  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-6 py-4 bg-dungeon-surface scrollbar-hide"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 40px, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40px, black 100%)',
      }}
    >
      <div className="flex flex-col gap-[11px] max-w-3xl mx-auto">
        {turns.map((turn) => (
          <NarrativeBlock
            key={turn.id}
            playerAction={turn.playerAction}
            narration={turn.narration}
            streaming={turn.streaming}
          />
        ))}
      </div>
    </div>
  );
}
