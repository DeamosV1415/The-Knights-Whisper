import { useState, useEffect } from "react";
import { OpeningSequence } from "./components/OpeningSequence";
import { GameScreen } from "./components/GameScreen";
import { BgmPlayer } from "./components/BgmPlayer";
import { initSDK } from "./runanywhere";
import { ModelManager, ModelCategory, EventBus } from "@runanywhere/web";

type SDKState = "initializing" | "downloading" | "loading" | "ready" | "fallback";

export function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [sdkState, setSdkState] = useState<SDKState>("initializing");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("Starting up…");

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        // Step 1: Initialize SDK
        setStatusMsg("Initializing AI engine…");
        console.log("[App] Calling initSDK()...");
        await initSDK();
        console.log("[App] ✓ initSDK() completed");

        // Step 2: Find the LLM model
        const allModels = ModelManager.getModels();
        console.log("[App] All registered models:", allModels.map(m => `${m.id} (${m.modality}, status: ${m.status})`));

        const models = allModels.filter(
          (m) => m.modality === ModelCategory.Language,
        );
        console.log("[App] Language models:", models.map(m => `${m.id} (status: ${m.status})`));

        if (models.length === 0) {
          console.warn("[App] No LLM model registered, using Groq fallback");
          setStatusMsg("No AI model found — using cloud AI");
          setSdkState("fallback");
          return;
        }

        const model = models[0];
        console.log(`[App] Selected model: ${model.id}, current status: ${model.status}`);

        // Step 3: Download if needed
        if (model.status !== "downloaded" && model.status !== "loaded") {
          setSdkState("downloading");
          setStatusMsg(`Downloading ${model.name}…`);
          setDownloadProgress(0);
          console.log(`[App] Starting download of ${model.id}...`);

          unsub = EventBus.shared.on("model.downloadProgress", (evt) => {
            if (evt.modelId === model.id) {
              const p = evt.progress ?? 0;
              setDownloadProgress(p);
              setStatusMsg(`Downloading AI model… ${(p * 100).toFixed(0)}%`);
            }
          });

          await ModelManager.downloadModel(model.id);
          unsub?.();
          unsub = null;
          setDownloadProgress(1);
          console.log(`[App] ✓ Download complete for ${model.id}`);
        } else {
          console.log(`[App] Model ${model.id} already downloaded (status: ${model.status})`);
        }

        // Step 4: Load into WASM engine
        setSdkState("loading");
        setStatusMsg("Loading model into memory…");
        console.log(`[App] Loading model ${model.id} into WASM...`);
        const ok = await ModelManager.loadModel(model.id);
        console.log(`[App] loadModel result: ${ok}`);

        if (ok) {
          // Verify it's actually loaded
          const loaded = ModelManager.getLoadedModel(ModelCategory.Language);
          console.log(`[App] ✓ Loaded model check: ${loaded?.id ?? 'null'}`);
          setSdkState("ready");
          setStatusMsg("AI ready!");
        } else {
          console.warn("[App] Model load returned false, using Groq fallback");
          setStatusMsg("Model load failed — using cloud AI");
          setSdkState("fallback");
        }
      } catch (err) {
        console.error("[App] RunAnywhere init failed:", err);
        setStatusMsg("Init failed — using cloud AI");
        setSdkState("fallback");
      }
    })();

    return () => {
      unsub?.();
    };
  }, []);

  const isSDKBusy =
    sdkState === "initializing" ||
    sdkState === "downloading" ||
    sdkState === "loading";

  return (
    <>
      <BgmPlayer />

      {/* Model loading overlay */}
      {isSDKBusy && (
        <div className="fixed inset-0 z-[100] bg-[#06040a] flex flex-col items-center justify-center gap-6">
          <div className="font-serif text-3xl text-dungeon-text tracking-widest animate-pulse">
            ⚔️ Preparing the Dungeon ⚔️
          </div>

          <div className="w-80 max-w-[90vw]">
            <div className="text-center text-[13px] text-dungeon-textmuted font-mono mb-3">
              {statusMsg}
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-dungeon-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width:
                    sdkState === "downloading"
                      ? `${downloadProgress * 100}%`
                      : sdkState === "loading"
                        ? "100%"
                        : "10%",
                  background: "linear-gradient(90deg, #6a4fa0, #9a70d0)",
                }}
              />
            </div>
          </div>

          <div className="text-[11px] text-dungeon-textfaint font-mono mt-4 opacity-70">
            On-device AI · No cloud required · Runs in your browser
          </div>
        </div>
      )}

      {/* Game content */}
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
