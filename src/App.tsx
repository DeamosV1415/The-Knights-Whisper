import { useState, useEffect } from 'react';
import { OpeningSequence } from './components/OpeningSequence';
import { GameScreen } from './components/GameScreen';
import { BgmPlayer } from './components/BgmPlayer';
import { initSDK } from './runanywhere';
import { ModelManager, ModelCategory, EventBus } from '@runanywhere/web';

type SDKState = 'initializing' | 'downloading' | 'loading' | 'ready' | 'fallback';

export function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [sdkState, setSdkState] = useState<SDKState>('initializing');
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        // Step 1: Initialize RunAnywhere SDK + backends
        await initSDK();

        // Step 2: Find the LLM model
        const models = ModelManager.getModels().filter(
          (m) => m.modality === ModelCategory.Language
        );

        if (models.length === 0) {
          console.warn('[App] No LLM model registered, using Groq fallback');
          setSdkState('fallback');
          return;
        }

        const model = models[0];

        // Step 3: Download if needed
        if (model.status !== 'downloaded' && model.status !== 'loaded') {
          setSdkState('downloading');
          setDownloadProgress(0);

          unsub = EventBus.shared.on('model.downloadProgress', (evt) => {
            if (evt.modelId === model.id) {
              setDownloadProgress(evt.progress ?? 0);
            }
          });

          await ModelManager.downloadModel(model.id);
          unsub?.();
          unsub = null;
          setDownloadProgress(1);
        }

        // Step 4: Load into WASM engine
        setSdkState('loading');
        const ok = await ModelManager.loadModel(model.id);

        if (ok) {
          setSdkState('ready');
          console.log('[App] On-device LLM ready');
        } else {
          console.warn('[App] Model load returned false, using Groq fallback');
          setSdkState('fallback');
        }
      } catch (err) {
        console.warn('[App] RunAnywhere init failed, using Groq fallback:', err);
        setSdkState('fallback');
      }
    })();

    return () => {
      unsub?.();
    };
  }, []);

  const isSDKBusy = sdkState === 'initializing' || sdkState === 'downloading' || sdkState === 'loading';

  return (
    <>
      <BgmPlayer />

      {/* Model loading overlay — shown during SDK init, blocks game start */}
      {isSDKBusy && (
        <div className="fixed inset-0 z-[100] bg-[#06040a] flex flex-col items-center justify-center gap-6">
          <div className="font-serif text-3xl text-dungeon-text tracking-widest animate-pulse">
            ⚔️ Preparing the Dungeon ⚔️
          </div>

          <div className="w-80 max-w-[90vw]">
            <div className="text-center text-[13px] text-dungeon-textmuted font-mono mb-3">
              {sdkState === 'initializing' && 'Initializing AI engine…'}
              {sdkState === 'downloading' && `Downloading AI model… ${(downloadProgress * 100).toFixed(0)}%`}
              {sdkState === 'loading' && 'Loading model into memory…'}
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-dungeon-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: sdkState === 'downloading'
                    ? `${downloadProgress * 100}%`
                    : sdkState === 'loading'
                    ? '100%'
                    : '10%',
                  background: 'linear-gradient(90deg, #6a4fa0, #9a70d0)',
                }}
              />
            </div>
          </div>

          <div className="text-[11px] text-dungeon-textfaint font-mono mt-4 opacity-70">
            On-device AI · No cloud required · Runs in your browser
          </div>
        </div>
      )}

      {/* Game content — visible once SDK is ready or in fallback mode */}
      {!isSDKBusy && (
        <>
          {!gameStarted ? (
            <OpeningSequence onComplete={() => setGameStarted(true)} />
          ) : (
            <GameScreen />
          )}
        </>
      )}
    </>
  );
}
