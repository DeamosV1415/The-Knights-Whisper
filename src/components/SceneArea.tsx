import entranceImg from '../assets/240_F_421852062_oLJjfT88cczyu3u28Qy3M2V8xmO8L770.jpg';
import corridorImg from '../assets/240_F_589592494_xjem0JGmU7Sc1GKgQ2Fo9LlwjYY6WIZi.jpg';

interface SceneAreaProps {
  dungeonOnAlert: boolean;
  gamePhase: string;
}

export function SceneArea({ dungeonOnAlert, gamePhase }: SceneAreaProps) {
  // Pick image based on game phase
  const isDeeper = gamePhase === 'corridor' || gamePhase === 'depths' || gamePhase === 'chamber';
  const bgImage = isDeeper ? corridorImg : entranceImg;

  const locationLabel = (() => {
    switch (gamePhase) {
      case 'intro':
      case 'entrance': return 'Tomb of Ashkar — Entrance';
      case 'corridor': return 'The Stone Corridor';
      case 'depths': return 'The Lower Depths';
      case 'chamber': return 'The Final Chamber';
      default: return 'Tomb of Ashkar';
    }
  })();
  
  return (
    <div className="relative w-full h-[220px] lg:h-[260px] overflow-hidden flex-shrink-0">
      {/* Background image */}
      <img 
        src={bgImage} 
        alt="Dungeon scene"
        className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
      />
      
      {/* Dark gradient overlays for atmosphere + readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, rgba(6,4,10,0.3) 0%, rgba(6,4,10,0.1) 40%, rgba(6,4,10,0.7) 100%),
            linear-gradient(90deg, rgba(6,4,10,0.4) 0%, transparent 30%, transparent 70%, rgba(6,4,10,0.4) 100%)
          `,
        }}
      />
      
      {/* Atmospheric purple/orange glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: dungeonOnAlert
            ? 'radial-gradient(ellipse at 50% 80%, rgba(200,40,40,0.15) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 80%, rgba(120,60,200,0.1) 0%, transparent 70%)',
          transition: 'background 1s ease',
        }}
      />
      
      {/* Scene title */}
      <div className="absolute top-4 left-5 flex items-center gap-3">
        <span className="text-[11px] tracking-[0.15em] uppercase font-mono" style={{ color: '#8a7aaa' }}>
          {locationLabel}
        </span>
      </div>
      
      {/* Alert badge */}
      {dungeonOnAlert && (
        <div 
          className="absolute top-3 right-4 px-3 py-1 text-[10px] tracking-[0.12em] font-mono rounded-md"
          style={{
            background: 'rgba(180,30,30,0.6)',
            border: '1px solid rgba(220,60,60,0.5)',
            color: '#ff6060',
            animation: 'pulse-red 2s ease-in-out infinite',
            boxShadow: '0 0 20px rgba(200,40,40,0.3)',
          }}
        >
          ⚠ DUNGEON ON ALERT
        </div>
      )}
      
      {/* Bottom gradient fade into content */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-16"
        style={{ background: 'linear-gradient(transparent, #0d0b10)' }}
      />
    </div>
  );
}
