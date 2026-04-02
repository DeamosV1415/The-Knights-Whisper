import { useState } from 'react';
import { OpeningSequence } from './components/OpeningSequence';
import { GameScreen } from './components/GameScreen';
import { BgmPlayer } from './components/BgmPlayer';

export function App() {
  const [gameStarted, setGameStarted] = useState(false);
  
  return (
    <>
      <BgmPlayer />
      {!gameStarted ? (
        <OpeningSequence onComplete={() => setGameStarted(true)} />
      ) : (
        <GameScreen />
      )}
    </>
  );
}
