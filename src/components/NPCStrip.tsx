import { useEffect, useRef, useState } from 'react';
import type { NPC, Disposition } from '../engine/worldState';

interface NPCStripProps {
  npcs: Record<string, NPC>;
}

const NPC_EMOJI: Record<string, string> = {
  merchant: '🧥',
  leftGuard: '⚔️',
  rightGuard: '⚔️',
  dagger: '👁️',
};

const DISPOSITION_COLORS: Record<Disposition, { ring: string; bg: string; pill: string; text: string; glow: string }> = {
  hostile: {
    ring: '#a02020',
    bg: '#200c0c',
    pill: '#3e1010',
    text: '#e05050',
    glow: 'rgba(200,40,40,0.25)',
  },
  neutral: {
    ring: '#4a3e6e',
    bg: '#14101e',
    pill: '#1e1a30',
    text: '#8a7ab0',
    glow: 'rgba(100,70,160,0.15)',
  },
  allied: {
    ring: '#2a8a4a',
    bg: '#0c1c12',
    pill: '#102e16',
    text: '#50c870',
    glow: 'rgba(50,180,80,0.2)',
  },
  cautious: {
    ring: '#5a5080',
    bg: '#14101e',
    pill: '#1e1a30',
    text: '#9a8ac0',
    glow: 'rgba(100,70,160,0.15)',
  },
  wary: {
    ring: '#8a6020',
    bg: '#1c1408',
    pill: '#2e2008',
    text: '#c09030',
    glow: 'rgba(180,120,30,0.2)',
  },
  fearful: {
    ring: '#8a6020',
    bg: '#1c1408',
    pill: '#2e2008',
    text: '#c09030',
    glow: 'rgba(180,120,30,0.2)',
  },
  unknown: {
    ring: '#3a3050',
    bg: '#100e18',
    pill: '#1a162a',
    text: '#6a5a8a',
    glow: 'rgba(80,60,120,0.1)',
  },
  dead: {
    ring: '#2a2030',
    bg: '#0a080e',
    pill: '#151218',
    text: '#4a3e5a',
    glow: 'rgba(40,30,50,0.1)',
  },
};

export function NPCStrip({ npcs }: NPCStripProps) {
  const npcList = Object.values(npcs).filter(npc => npc.alive || npc.disposition === 'dead');
  
  // Track previous dispositions for animation triggers
  const prevDispositionsRef = useRef<Record<string, Disposition>>({});
  const [changedNpcs, setChangedNpcs] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const changedIds = new Set<string>();
    
    for (const npc of npcList) {
      const prevDisp = prevDispositionsRef.current[npc.id];
      if (prevDisp && prevDisp !== npc.disposition) {
        changedIds.add(npc.id);
      }
    }
    
    if (changedIds.size > 0) {
      setChangedNpcs(changedIds);
      
      const timer = setTimeout(() => {
        setChangedNpcs(new Set());
      }, 1000);
      
      // Update previous dispositions
      const newPrev: Record<string, Disposition> = {};
      for (const npc of npcList) {
        newPrev[npc.id] = npc.disposition;
      }
      prevDispositionsRef.current = newPrev;
      
      return () => clearTimeout(timer);
    }
    
    // Update previous dispositions even when no change
    const newPrev: Record<string, Disposition> = {};
    for (const npc of npcList) {
      newPrev[npc.id] = npc.disposition;
    }
    prevDispositionsRef.current = newPrev;
  }, [npcList]);
  
  return (
    <div className="bg-dungeon-elevated py-4 px-3">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] mb-3 px-1" style={{ color: '#5a4a6a' }}>
        Nearby
      </div>
      <div className="flex flex-col gap-3">
        {npcList.map((npc) => {
          const colors = DISPOSITION_COLORS[npc.disposition];
          const emoji = NPC_EMOJI[npc.id] || '👤';
          const isDead = npc.disposition === 'dead';
          const hasChanged = changedNpcs.has(npc.id);
          
          return (
            <div 
              key={npc.id} 
              className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-500 ${
                hasChanged ? 'animate-npc-flash' : ''
              }`}
              style={{ 
                background: hasChanged 
                  ? `${colors.glow}` 
                  : 'rgba(255,255,255,0.02)',
                borderLeft: hasChanged ? `2px solid ${colors.ring}` : '2px solid transparent',
                transition: 'background 0.5s, border-left 0.3s',
              }}
            >
              {/* Avatar */}
              <div 
                className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-xl flex-shrink-0 transition-all duration-500 ${
                  hasChanged ? 'animate-npc-ring-pulse' : ''
                }`}
                style={{
                  background: colors.bg,
                  border: `2px solid ${colors.ring}`,
                  boxShadow: hasChanged 
                    ? `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}` 
                    : `0 0 12px ${colors.glow}`,
                  opacity: isDead ? 0.4 : 1,
                  filter: isDead ? 'grayscale(1)' : 'none',
                }}
              >
                {emoji}
              </div>
              
              {/* Name + Disposition */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono text-dungeon-textdim truncate">
                  {npc.name}
                </div>
                <div 
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider transition-all duration-500 ${
                    hasChanged ? 'animate-stat-flash' : ''
                  }`}
                  style={{
                    background: colors.pill,
                    color: colors.text,
                    border: `0.5px solid ${colors.ring}40`,
                    boxShadow: hasChanged ? `0 0 12px ${colors.glow}` : 'none',
                  }}
                >
                  {npc.disposition}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
