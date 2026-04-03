<p align="center">
  <img src="docs/screenshots/title.png" alt="Whisper World — An AI Dungeon Master" width="800" />
</p>

<h1 align="center">⚔️ Whisper World</h1>
<h3 align="center">An AI-Powered Dungeon Crawler — Built for HackXtreme</h3>

<p align="center">
  <strong>Team: The Knight's Whisper</strong><br/>
  Step into the Tomb of Ashkar. Every choice matters. Every whisper echoes.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/RunAnywhere_SDK-On--Device_AI-ff6b35?style=for-the-badge" alt="RunAnywhere" />
  <img src="https://img.shields.io/badge/Groq-Cloud_LLM-00d4aa?style=for-the-badge" alt="Groq" />
  <img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge" alt="React" />
  <img src="https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge" alt="Vite" />
</p>

---

## 🎮 What is Whisper World?

**Whisper World** is a fully AI-driven dungeon crawler where a large language model acts as your **Dungeon Master**. There are no scripted paths — every action you take generates a unique narrative response. Navigate treacherous corridors, barter with merchants, outwit guards, and retrieve the legendary artifact from the Tomb of Ashkar.

The game features:
- 🧠 **On-device AI** via [RunAnywhere SDK](https://runanywhere.ai) — downloads and loads an LLM directly in your browser using WebAssembly + WebGPU
- ☁️ **Cloud inference** via [Groq](https://groq.com) — blazing-fast narration powered by Llama 3.3 70B
- ⚔️ **Dynamic world state** — HP, gold, NPC dispositions, and inventory update in real-time based on your choices
- 🎵 **Atmospheric BGM** — immersive dungeon soundtrack
- 🎲 **Multiple endings** — victory, defeat, or something in between

---

## 📸 Screenshots

### Loading Screen — On-Device AI Model Download
<img src="docs/screenshots/loading.png" alt="Loading Screen" width="800" />

> The RunAnywhere SDK downloads and loads "LFM2 350M" (a 250MB language model) directly into your browser via WebAssembly. No server needed.

### Opening Sequence
<img src="docs/screenshots/title.png" alt="Title Screen" width="800" />

> The story begins at the entrance of the Tomb of Ashkar. A hooded merchant, two guards, and darkness await.

### Game Interface
<img src="docs/screenshots/gamescreen.png" alt="Game Screen" width="800" />

> **Left sidebar:** Nearby NPCs with disposition indicators, HP/Gold bars, location, and inventory.  
> **Main area:** Story log with your actions and the AI's narrative responses.  
> **Bottom:** Free-text input — type anything you want to do.

### Live Gameplay — AI Narration
<img src="docs/screenshots/gameplay.png" alt="Gameplay" width="800" />

> Type an action like *"I look around the dark dungeon entrance"* and the AI Dungeon Master responds with atmospheric, context-aware narration. NPC dialogue appears in gold italics.

---

## 🚀 How to Play

### Getting Started
1. **Wait for the AI to load** — On first visit, the RunAnywhere SDK downloads the on-device model (~250MB). This is cached for future sessions.
2. **Read the opening** — The story sets the scene. Press any key to enter the dungeon.
3. **Type your actions** — Use natural language to describe what you do. Be creative!

### Example Actions
| Action | What Happens |
|---|---|
| *"I approach the merchant and ask what he sells"* | The merchant responds with available wares and prices |
| *"I bribe the left guard with 5 gold"* | Attempt to bribe — may succeed or fail based on context |
| *"I sneak past the guards using the shadows"* | Stealth attempt — the AI decides the outcome |
| *"I attack the right guard with my dagger"* | Combat — you may take damage or gain advantage |
| *"I search the walls for hidden passages"* | Exploration — discover secrets the AI generates |

### Game Mechanics
- **HP (Health Points):** Starts at 100. Reach 0 and it's game over.
- **Gold:** Starts at 15g. Use it to buy items, bribe NPCs, or trade.
- **NPC Dispositions:** NPCs react to your actions — their attitude shifts between hostile, wary, neutral, and friendly.
- **Inventory:** Items you acquire appear in the sidebar.
- **Dungeon Alert:** Cause too much chaos and the dungeon goes on high alert.

### Win Condition
🏆 Retrieve the **artifact** from the depths of the tomb and escape!

### Lose Condition
💀 Your HP drops to 0 — darkness claims you.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Vite + React)            │
├──────────────┬──────────────────────────────────────┤
│  RunAnywhere │  Model Management                     │
│  SDK (WASM)  │  • Download LFM2 350M from HuggingFace│
│              │  • Load into WebAssembly engine        │
│              │  • WebGPU acceleration                 │
├──────────────┼──────────────────────────────────────┤
│  Groq API    │  Game Inference                       │
│  (Cloud)     │  • Llama 3.3 70B narration            │
│              │  • Streaming token-by-token            │
│              │  • STATE_UPDATE JSON patches           │
├──────────────┼──────────────────────────────────────┤
│  Game Engine │  State Management                     │
│              │  • worldState.ts — game data model     │
│              │  • useWorldState.ts — React hook        │
│              │  • prompts.ts — AI prompt engineering   │
│              │  • api.ts — LLM orchestration           │
└──────────────┴──────────────────────────────────────┘
```

### Key Technical Decisions

- **RunAnywhere SDK** handles model lifecycle (download → OPFS caching → WASM loading → WebGPU acceleration). The model persists across page reloads via the browser's Origin Private File System.
- **Groq** handles actual game inference because WASM-based token generation runs on the main thread and would freeze the UI. Groq provides sub-second streaming with Llama 3.3 70B.
- **State Updates** are embedded in the AI's response as `<STATE_UPDATE>{...}</STATE_UPDATE>` JSON blocks, parsed with a multi-strategy extractor that handles various AI output formats.

---

## 🛠️ Setup & Development

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- A modern browser with **WebGPU** support (Chrome 113+, Edge 113+)

### Installation

```bash
# Clone the repo
git clone https://github.com/DeamosV1415/The-Knights-Whisper.git
cd The-Knights-Whisper

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Groq API key (get one free at https://console.groq.com)
VITE_GROQ_API_KEY=your_groq_api_key_here

# RunAnywhere API key (from https://console.runanywhere.ai)
VITE_RUNANYWHERE_API_KEY=your_runanywhere_api_key_here
```

### Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

The output is in `dist/` — deploy as a static site.

---

## 📁 Project Structure

```
src/
├── App.tsx                      # Main app — SDK init, model loading, routing
├── runanywhere.ts               # RunAnywhere SDK config & model catalog
├── engine/
│   ├── api.ts                   # LLM orchestration (RunAnywhere + Groq)
│   ├── prompts.ts               # System prompt & conversation builder
│   └── worldState.ts            # Game state data model & types
├── hooks/
│   └── useWorldState.ts         # React hook for state management
├── components/
│   ├── OpeningSequence.tsx      # Title screen & intro narration
│   ├── GameScreen.tsx           # Main game layout
│   ├── SceneArea.tsx            # Scene banner with dungeon art
│   ├── StoryLog.tsx             # Scrollable narration history
│   ├── InputBar.tsx             # Player action input
│   ├── NPCStrip.tsx             # NPC cards with dispositions
│   ├── StatsRow.tsx             # HP, Gold, Location, Inventory
│   ├── StatChangeToast.tsx      # Animated stat change notifications
│   ├── NarrativeBlock.tsx       # Individual narration display
│   └── BgmPlayer.tsx            # Background music controller
└── workers/
    └── vlm-worker.ts            # Web Worker for VLM inference
```

---

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite 6** | Build tool & dev server |
| **TypeScript** | Type safety |
| **RunAnywhere Web SDK** | On-device LLM (WASM + WebGPU) |
| **Groq SDK** | Cloud LLM inference |
| **Llama 3.3 70B** | Game narration model (via Groq) |
| **LFM2 350M** | On-device model (via RunAnywhere) |
| **TailwindCSS** | Styling |
| **OPFS** | Browser-side model caching |

---

## 👥 Team — The Knight's Whisper

Built with ⚔️ for **HackXtreme**

---
