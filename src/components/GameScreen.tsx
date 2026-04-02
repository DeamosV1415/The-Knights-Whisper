import { useState } from 'react';
import type { TurnEntry } from '../engine/worldState';
import { streamNarration } from '../engine/api';
import { useWorldState } from '../hooks/useWorldState';
import { SceneArea } from './SceneArea';
import { NPCStrip } from './NPCStrip';
import { StatsRow } from './StatsRow';
import { StoryLog } from './StoryLog';
import { InputBar } from './InputBar';
import { StatChangeToast } from './StatChangeToast';

export function GameScreen() {
  const { worldState, changes, applyPatch, dismissChange, reset } = useWorldState();
  const [turns, setTurns] = useState<TurnEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const handlePlayerAction = async (action: string) => {
    if (isStreaming) return;
    
    const turnId = `turn-${Date.now()}`;
    const newTurn: TurnEntry = {
      id: turnId,
      playerAction: action,
      narration: '',
      streaming: true,
    };
    
    setTurns(prev => [...prev, newTurn]);
    setIsStreaming(true);
    
    await streamNarration(
      action,
      worldState,
      turns,
      // onToken — immutable update: clone the turn object
      (token: string) => {
        setTurns(prev => {
          return prev.map(turn => {
            if (turn.id === turnId) {
              return { ...turn, narration: turn.narration + token };
            }
            return turn;
          });
        });
      },
      // onStateUpdate — merge world state patch via useWorldState hook
      (patch: Partial<typeof worldState>) => {
        applyPatch(patch);
        
        // Mark turn streaming as complete
        setTurns(prev => {
          return prev.map(turn => {
            if (turn.id === turnId) {
              return { ...turn, streaming: false };
            }
            return turn;
          });
        });
        
        setIsStreaming(false);
      }
    );
  };
  
  const handleRestart = () => {
    reset();
    setTurns([]);
    setIsStreaming(false);
  };
  
  const isGameEnded = worldState.flags.endingType !== null;
  const isVictory = worldState.flags.artifactRetrieved;
  const isDefeat = worldState.player.health <= 0;
  
  return (
    <div className="h-screen flex flex-col bg-[#06040a] relative overflow-hidden">
      {/* ── Top: Scene Banner ── */}
      <SceneArea dungeonOnAlert={worldState.flags.dungeonOnAlert} gamePhase={worldState.flags.gamePhase} />
      
      {/* ── Stat Change Toasts ── */}
      <StatChangeToast changes={changes} onDismiss={dismissChange} />
      
      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-0 min-h-0">
        {/* Left Sidebar: NPCs + Stats */}
        <aside className="w-full lg:w-[300px] xl:w-[340px] flex-shrink-0 bg-dungeon-surface border-r border-dungeon-borderfaint flex flex-col overflow-y-auto scrollbar-hide">
          <NPCStrip npcs={worldState.npcs} />
          <StatsRow player={worldState.player} />
        </aside>
        
        {/* Right: Story Log + Input */}
        <main className="flex-1 flex flex-col min-h-0 bg-dungeon-surface">
          <StoryLog turns={turns} />
          <InputBar onSubmit={handlePlayerAction} disabled={isStreaming || isGameEnded} />
        </main>
      </div>
      
      {/* ── Ending Overlay ── */}
      {(isVictory || isDefeat) && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="max-w-xl px-8 flex flex-col items-center gap-6">
            <h2 className="font-serif text-5xl tracking-wide" style={{ color: isVictory ? '#50d070' : '#e05050' }}>
              {isVictory ? '⚔️ Victory' : '💀 Defeat'}
            </h2>
            
            <div className="font-serif text-[16px] leading-[1.9] text-dungeon-text text-center">
              {isVictory ? (
                <>
                  You have retrieved the artifact from the depths of Ashkar's tomb. 
                  {worldState.flags.dungeonOnAlert 
                    ? ' The dungeon still howls behind you.' 
                    : worldState.flags.leftGuardBribed || worldState.flags.rightGuardBribed
                    ? ' You walked out with allies you never expected.'
                    : ' You leave them all breathing — a rare thing, in places like this.'}
                </>
              ) : (
                <>
                  The darkness claims you. Your body joins the countless others 
                  who sought fortune in the Tomb of Ashkar. The merchant will add 
                  your story to his collection of warnings unheeded.
                </>
              )}
            </div>
            
            <button
              onClick={handleRestart}
              className="px-8 py-3 rounded-lg text-[14px] font-mono transition-all duration-300 hover:scale-105 cursor-pointer"
              style={{
                background: isVictory
                  ? 'linear-gradient(135deg, #1a5a2a, #308a50)'
                  : 'linear-gradient(135deg, #6a1818, #a03030)',
                border: `1px solid ${isVictory ? '#308a50' : '#d04040'}`,
                color: '#e0d8f0',
                boxShadow: `0 0 30px ${isVictory ? 'rgba(48,138,80,0.3)' : 'rgba(160,48,48,0.3)'}`,
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
