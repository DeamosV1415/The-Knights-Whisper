import { useEffect, useRef, useState } from 'react';
import type { PlayerState } from '../engine/worldState';

interface StatsRowProps {
  player: PlayerState;
}

export function StatsRow({ player }: StatsRowProps) {
  const hpPercent = (player.health / player.maxHealth) * 100;
  const hpColor = hpPercent > 50 ? '#c03030' : hpPercent > 25 ? '#c06020' : '#e02020';
  const goldDisplay = player.gold;
  
  // Track previous values for animation triggers
  const prevHpRef = useRef(player.health);
  const prevGoldRef = useRef(player.gold);
  const prevInventoryRef = useRef<string[]>(player.inventory);
  
  const [hpAnim, setHpAnim] = useState<'damage' | 'heal' | null>(null);
  const [goldAnim, setGoldAnim] = useState(false);
  const [hpDelta, setHpDelta] = useState<number | null>(null);
  const [goldDelta, setGoldDelta] = useState<number | null>(null);
  const [newItems, setNewItems] = useState<Set<string>>(new Set());
  
  // Detect HP changes
  useEffect(() => {
    const delta = player.health - prevHpRef.current;
    if (delta !== 0) {
      setHpAnim(delta < 0 ? 'damage' : 'heal');
      setHpDelta(delta);
      
      const clearTimer = setTimeout(() => {
        setHpAnim(null);
        setHpDelta(null);
      }, 1000);
      
      prevHpRef.current = player.health;
      return () => clearTimeout(clearTimer);
    }
  }, [player.health]);
  
  // Detect gold changes
  useEffect(() => {
    const delta = player.gold - prevGoldRef.current;
    if (delta !== 0) {
      setGoldAnim(true);
      setGoldDelta(delta);
      
      const clearTimer = setTimeout(() => {
        setGoldAnim(false);
        setGoldDelta(null);
      }, 800);
      
      prevGoldRef.current = player.gold;
      return () => clearTimeout(clearTimer);
    }
  }, [player.gold]);
  
  // Detect new inventory items
  useEffect(() => {
    const prevSet = new Set(prevInventoryRef.current);
    const added = player.inventory.filter(item => !prevSet.has(item));
    
    if (added.length > 0) {
      setNewItems(new Set(added));
      
      const clearTimer = setTimeout(() => {
        setNewItems(new Set());
      }, 600);
      
      prevInventoryRef.current = [...player.inventory];
      return () => clearTimeout(clearTimer);
    }
    
    prevInventoryRef.current = [...player.inventory];
  }, [player.inventory]);
  
  return (
    <div className="bg-dungeon-deep border-t border-dungeon-borderfaint px-4 py-3 flex flex-col gap-3">
      {/* HP */}
      <div 
        className={`flex items-center gap-2 ${hpAnim === 'damage' ? 'animate-damage-shake' : ''}`}
      >
        <span className="text-[10px] font-mono w-8" style={{ color: '#a03030' }}>HP</span>
        <div 
          className={`flex-1 h-2 bg-dungeon-statbg rounded-full overflow-hidden ${
            hpAnim === 'damage' ? 'animate-hp-pulse' : 
            hpAnim === 'heal' ? 'animate-hp-heal-pulse' : ''
          }`}
        >
          <div 
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ 
              width: `${hpPercent}%`,
              background: `linear-gradient(90deg, ${hpColor}, ${hpColor}aa)`,
              boxShadow: `0 0 8px ${hpColor}40`,
            }}
          />
        </div>
        <span 
          className={`text-[10px] font-mono text-dungeon-textdim w-14 text-right relative ${
            hpAnim ? 'animate-stat-flash' : ''
          }`}
        >
          {player.health}/{player.maxHealth}
          {/* Floating delta */}
          {hpDelta !== null && (
            <span 
              className="absolute -top-3 right-0 text-[10px] font-mono font-bold animate-delta-float"
              style={{ color: hpDelta < 0 ? '#ff4040' : '#40e060' }}
            >
              {hpDelta > 0 ? '+' : ''}{hpDelta}
            </span>
          )}
        </span>
      </div>
      
      {/* Gold */}
      <div className="flex items-center gap-2">
        <span 
          className={`text-[10px] font-mono w-8 ${goldAnim ? 'animate-gold-shimmer' : ''}`}
          style={{ color: '#c0a030' }}
        >
          GOLD
        </span>
        <div className="flex-1 h-2 bg-dungeon-statbg rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              goldAnim ? 'animate-gold-shimmer' : ''
            }`}
            style={{ 
              width: `${Math.min((goldDisplay / 50) * 100, 100)}%`,
              background: 'linear-gradient(90deg, #a07020, #c0a040)',
              boxShadow: '0 0 8px rgba(192,160,64,0.3)',
            }}
          />
        </div>
        <span 
          className={`text-[10px] font-mono text-dungeon-textdim w-14 text-right relative ${
            goldAnim ? 'animate-stat-flash' : ''
          }`}
        >
          {goldDisplay}g
          {/* Floating delta */}
          {goldDelta !== null && (
            <span 
              className="absolute -top-3 right-0 text-[10px] font-mono font-bold animate-delta-float"
              style={{ color: goldDelta < 0 ? '#c0a040' : '#e8d060' }}
            >
              {goldDelta > 0 ? '+' : ''}{goldDelta}g
            </span>
          )}
        </span>
      </div>
      
      {/* Location */}
      <div className="flex items-center gap-2 pt-1 border-t border-dungeon-borderfaint">
        <span className="text-[9px] font-mono" style={{ color: '#5a4a6a' }}>📍</span>
        <span className="text-[10px] font-mono text-dungeon-ghost truncate">{player.location}</span>
      </div>
      
      {/* Inventory */}
      <div className="flex flex-wrap gap-1.5">
        {player.inventory.length === 0 ? (
          <span className="text-dungeon-textfaint text-[9px] font-mono italic">no items</span>
        ) : (
          player.inventory.map((item, idx) => (
            <span 
              key={`${item}-${idx}`}
              className={`px-2 py-0.5 rounded-md text-[9px] font-mono ${
                newItems.has(item) ? 'animate-inventory-in' : ''
              }`}
              style={{
                background: newItems.has(item) ? '#1e1830' : '#1a1624',
                border: `1px solid ${newItems.has(item) ? '#4a3e80' : '#2e2844'}`,
                color: newItems.has(item) ? '#b0a0d8' : '#8a7ab0',
                boxShadow: newItems.has(item) ? '0 0 12px rgba(100,70,200,0.2)' : 'none',
                transition: 'background 0.5s, border-color 0.5s, color 0.5s, box-shadow 0.5s',
              }}
            >
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
