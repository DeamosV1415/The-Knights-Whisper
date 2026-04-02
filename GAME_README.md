# 🗡️ The Knights' Whisper

**A streaming AI dungeon master RPG powered by Groq**

An atmospheric dark fantasy text adventure where every action is narrated by a sophisticated AI dungeon master. Built for HackXtreme with React, TypeScript, and Groq's LLaMA streaming API.

---

## 🎮 Features

### Core Gameplay
- **Real-time AI Narration**: Word-by-word streaming creates a typewriter effect as the dungeon master responds to your actions
- **Dynamic World State**: NPCs remember your actions, dispositions shift, and the world reacts organically
- **Multiple Victory Paths**: Win through combat, stealth, or manipulation
- **Atmospheric UI**: Pure CSS dungeon scene with flickering torches and animated elements
- **State Management**: Deep world state tracking with HP, gold, inventory, and complex NPC relationships

### Visual Design
- **Custom Dark Palette**: 50+ dungeon-themed colors (hostile reds, neutral purples, friendly greens, wary oranges)
- **Disposition Tracking**: Visual NPC strip shows real-time relationship changes with animated transitions
- **Serif Narration**: IM Fell English font for immersive storytelling
- **Monospace UI**: Courier Prime for stats and player input
- **CSS Animations**: Torch flicker, cursor blink, fade transitions

### Technical Highlights
- **Groq Streaming API**: `llama-3.3-70b-versatile` model with browser-safe client
- **TypeScript Safety**: Fully typed world state, NPCs, flags, and turn system
- **React 19**: Modern hooks-based architecture
- **Tailwind CSS**: Custom theme extension with complete color system
- **Vite**: Lightning-fast hot module replacement

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- A Groq API key ([get one free at console.groq.com](https://console.groq.com))

### Installation

1. **Add your Groq API key**:
   ```bash
   # Edit .env and replace with your actual key
   VITE_GROQ_API_KEY=your_actual_groq_api_key_here
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Start the dev server**:
   ```bash
   npm run dev
   ```

4. **Open the game**:
   Navigate to `http://localhost:5173` in your browser

5. **Play**:
   - Watch the opening sequence (typewriter effect)
   - Press any key to begin
   - Type actions like "talk to the merchant" or "attack the left guard"
   - See the AI dungeon master respond in real-time!

---

## 📁 Project Structure

```
src/
├── engine/
│   ├── worldState.ts    # Types & state merge logic
│   ├── api.ts           # Groq streaming integration
│   └── prompts.ts       # System prompt builder
├── data/
│   └── scenario.ts      # Initial world state & NPC lore
├── components/
│   ├── GameScreen.tsx   # Master orchestrator
│   ├── OpeningSequence.tsx
│   ├── SceneArea.tsx    # CSS dungeon visualization
│   ├── NPCStrip.tsx     # Disposition tracker
│   ├── StatsRow.tsx     # HP/gold/inventory
│   ├── StoryLog.tsx     # Scrolling narrative
│   ├── NarrativeBlock.tsx
│   └── InputBar.tsx
├── styles/
│   └── index.css        # Tailwind + animations
└── App.tsx              # Root component
```

---

## 🎯 Game Mechanics

### NPCs
- **Merchant** (🧥): Sells items, knows the secret name "Crow"
- **Left Guard** (⚔️): Dominant, owes gambling debts, can be bribed (10g)
- **Right Guard** (⚔️): Passive follower, confused without left guard
- **Dagger** (👁️): Weapons trader inside the dungeon

### Dispositions
NPCs shift between: `allied`, `neutral`, `cautious`, `wary`, `hostile`, `fearful`, `dead`

Each disposition has unique visual styling (colored rings, backgrounds, pills)

### Victory Conditions
- Retrieve the artifact from the final chamber
- Different ending narrations based on playstyle (combat/stealth/manipulation)

### Defeat Conditions
- Health reaches 0 (vivid death narration)

---

## 🔧 Configuration

### Color Palette
All 50+ colors defined in `tailwind.config.ts` under the `dungeon` namespace:
- **Base**: `bg`, `surface`, `elevated`, `border`, `text`, etc.
- **Dispositions**: `hostile`, `neutral`, `friendly`, `wary` (each with bg/text/pill variants)
- **UI**: `inputbg`, `sendbg`, `invtag`, `hp`, `gold2`

### Fonts
- **Serif**: IM Fell English (narration)
- **Mono**: Courier Prime (UI, stats, input)

Loaded via Google Fonts CDN in `index.html`

### API Settings
Model: `llama-3.3-70b-versatile`  
Max tokens: 400  
Temperature: 0.8  
Streaming: Enabled

---

## 🎨 Design Philosophy

This project was built for judges to **feel something in the first 30 seconds**:

1. **Opening Sequence**: Typewriter reveal of atmospheric scene text
2. **Visual Depth**: Torch animations, silhouettes, stone textures
3. **Streaming Narration**: Word-by-word AI response creates tension
4. **Reactive NPCs**: Dispositions change visually with smooth transitions
5. **Medieval Aesthetic**: Dark purples, serif text, monospace stats

The UI is **pure atmosphere** — no images, no external assets, just CSS art and streaming text.

---

## 🧪 Testing the Game

### Example Actions
- `"Talk to the merchant"`
- `"Ask about Crow"`
- `"Bribe the left guard with 10 gold"`
- `"Attack the right guard"`
- `"Walk through the gate"`
- `"Search for the soldier's sword"`

### Expected Behavior
1. Player action appears in blue with › arrow
2. AI narration streams word-by-word below in serif
3. STATE_UPDATE JSON parsed invisibly, world state merges
4. NPCs change disposition (visual animation)
5. Stats update (gold deducted, HP decreased, items added)
6. Alert badge appears if dungeon goes on alert

---

## 🐛 Troubleshooting

### "The dungeon master has gone silent"
- Check your Groq API key in `.env`
- Ensure `VITE_GROQ_API_KEY` is set correctly
- Restart dev server after changing `.env`

### Build Errors
```bash
npm run build
```
Should complete successfully. If Tailwind errors occur, ensure `@tailwindcss/postcss` is installed.

### No Streaming
- Open browser DevTools Console
- Check for CORS or API errors
- Verify `dangerouslyAllowBrowser: true` is set in `src/engine/api.ts`

---

## 📦 Production Build

```bash
npm run build
npm run preview
```

Output in `dist/` folder, ready for deployment to Vercel, Netlify, etc.

---

## 🏆 HackXtreme Submission

**What Makes This Special:**

1. **Emotional Impact**: Atmospheric design + streaming narration = instant immersion
2. **Technical Depth**: Complex state management, streaming API, TypeScript safety
3. **Polish**: 50+ custom colors, CSS animations, serif/mono typography
4. **Replayability**: Multiple paths (combat/stealth/diplomacy) with dynamic endings
5. **Completeness**: From opening sequence → gameplay → victory/defeat screens, fully playable

**Demo Flow for Judges:**
1. Open app → typewriter intro (15 seconds)
2. Press key → torch animations + NPC strip visible
3. Type action → watch streaming AI narration (10 seconds)
4. See NPC disposition change + stats update
5. Total: 30 seconds to "feel" the experience

---

## 🤝 Credits

**Built by**: OpenCode Assistant  
**Specification**: "Build a complete web app called Whi.txt"  
**Model**: Claude Sonnet 4.5  
**AI Narration**: Groq (LLaMA 3.3 70B)  
**Fonts**: Google Fonts (IM Fell English, Courier Prime)  
**Framework**: React 19 + Vite + TypeScript + Tailwind CSS

---

## 📄 License

MIT License — Free to use, modify, and deploy.

---

## 🎭 Enjoy the Tomb of Ashkar

*"The darkness claims you, or you claim the artifact. Either way, the story is yours to write."*

Start your adventure: `npm run dev`
