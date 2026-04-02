import { useState, useRef, useEffect } from "react";
import bgmSrc from "../assets/Dungeon Master BGM.mp3";

export function BgmPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true); // start muted, user opts in

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    audio.loop = true;
    // Try to autoplay (will be muted, so browsers allow it)
    audio.play().catch(() => {});
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (muted) {
      // Unmute and ensure playing
      audio.muted = false;
      audio.play().catch(() => {});
    } else {
      audio.muted = true;
    }
    setMuted(!muted);
  };

  return (
    <>
      <audio ref={audioRef} src={bgmSrc} muted loop />
      <button
        onClick={toggle}
        title={muted ? "Enable BGM" : "Mute BGM"}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110"
        style={{
          background: muted ? "rgba(20,16,30,0.8)" : "rgba(60,40,120,0.6)",
          border: `1px solid ${muted ? "#2a2240" : "#6a50b0"}`,
          boxShadow: muted ? "none" : "0 0 15px rgba(100,70,200,0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        {muted ? (
          // Muted icon
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6a5a8a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          // Playing icon
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c0b0e8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </>
  );
}
