import { useState, useEffect } from 'react';
import { OPENING_SCENE } from '../data/scenario';
import entranceImg from '../assets/240_F_421852062_oLJjfT88cczyu3u28Qy3M2V8xmO8L770.jpg';

interface OpeningSequenceProps {
  onComplete: () => void;
}

export function OpeningSequence({ onComplete }: OpeningSequenceProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  
  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < OPENING_SCENE.length) {
        setDisplayedText(OPENING_SCENE.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setShowPrompt(true);
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle any key press or click
  useEffect(() => {
    if (!showPrompt) return;
    
    const handleInteraction = () => {
      setFadeOut(true);
      setTimeout(() => {
        onComplete();
      }, 600);
    };
    
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);
    
    return () => {
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [showPrompt, onComplete]);
  
  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: '#06040a' }}
    >
      {/* Background image with heavy overlay */}
      <img 
        src={entranceImg} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.25, filter: 'blur(2px)' }}
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(6,4,10,0.5) 0%, rgba(6,4,10,0.85) 100%)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-2xl px-8 flex flex-col items-center gap-10">
        {/* Title */}
        <div className="flex flex-col items-center gap-3">
          <h1 
            className="font-serif text-6xl lg:text-7xl tracking-wide"
            style={{ 
              color: '#e0d4f8',
              textShadow: '0 0 40px rgba(120,80,200,0.3), 0 0 80px rgba(80,40,160,0.15)',
            }}
          >
            Whisper World
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: '#5a4a7a' }}>
            an AI dungeon master
          </p>
        </div>
        
        {/* Opening Scene Text */}
        <div 
          className="font-serif text-[16px] lg:text-[18px] leading-[2] text-center max-w-xl"
          style={{ color: '#b0a4c8' }}
        >
          {displayedText}
          {!showPrompt && (
            <span 
              className="inline-block w-[7px] h-[17px] rounded-[2px] ml-1 animate-blink align-middle"
              style={{ background: 'linear-gradient(180deg, #7a5af0, #c0b4d4)' }}
            />
          )}
        </div>
        
        {/* Press Any Key Prompt */}
        {showPrompt && (
          <div 
            className="font-mono text-[11px] uppercase tracking-[0.25em] animate-blink"
            style={{ color: '#6a5a8a' }}
          >
            press any key to begin
          </div>
        )}
      </div>
    </div>
  );
}
