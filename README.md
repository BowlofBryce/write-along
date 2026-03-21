# Write Along

Write Along is a production-oriented macOS desktop foundation for long-form book writing with a deeply integrated AI story partner, dynamic memory bank, and onboarding flow for local AI runtime setup.

## Stack

- **Desktop shell:** Electron + preload IPC boundary
- **UI:** React + TypeScript + Tailwind
- **Editor:** TipTap (ProseMirror-based)
- **State:** Zustand
- **Persistence:** SQLite (`better-sqlite3`) for projects/settings
- **Packaging:** `electron-builder` macOS targets (`dmg`, `zip`)

## Product Foundation Included

### Standalone desktop app
- Native Electron window with hidden inset macOS title bar
- Build and package pipeline for clickable macOS app bundle

### First-run onboarding for macOS
- Multi-stage polished onboarding screens:
  1. Welcome
  2. Dependency check
  3. Install missing requirements
  4. Local AI provider setup
  5. Ready-to-launch
- Dependency checks for Homebrew, Ollama, Git, and app support directories
- Installer action hooks via secure IPC
- Onboarding completion persisted and resettable in Settings

### Writing workspace layout
- **Left:** structure sidebar with chapter/scene creation and searchable hierarchy
- **Center:** rich long-form editor (TipTap) with autosave and manuscript/draft modes
- **Right:** AI panel with tabs for Live Suggestions, Ask the Story, Memory Bank, and AI Actions
- **Top toolbar:** formatting action trigger, focus mode, export, theme toggle
- **Bottom status bar:** total words, scene words, autosave state, active memory slate status

### AI/memory architecture foundation
- Typed dynamic memory object model with:
  - importance, durability, retrieval priority, confidence
  - active/inactive/archived states
  - user pinned/edited flags
  - contradiction and ambiguity markers
  - linked memory references
- Active-memory slate scoring engine
- Ask-the-story query UI grounded in memory objects
- Structured AI formatting command parser (natural language → typed operations)

### Persistence & export
- SQLite project/settings storage in app data
- Autosave loop
- Export manuscript to Markdown via native save dialog

## Development

### Prerequisites
- Node.js 20+
- npm 10+
- macOS recommended for full dependency/onboarding behavior

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Launch without typing commands

You can run the repository-root `launcher` executable (double-click in Finder or run `./launcher`).  
It will install dependencies if needed, then:
- build missing desktop artifacts automatically (`dist` + `dist-electron`) to avoid Electron “Cannot find module ... dist-electron/main.js” errors
- launch the desktop app once artifacts are ready

Optional launcher modes:
- `./launcher --dev` → force development mode
- `./launcher --build` → force a rebuild before launch

### Configure local AI models in-app

1. Open **Settings** in the AI panel.
2. Set your local runtime URL (default: `http://127.0.0.1:11434`).
3. Click **Refresh models** to fetch installed models from Ollama.
4. Choose a model chip (or type one manually), then click **Save AI settings**.

The app will use these saved values for all AI actions (Ask the Story, content rewrites, summaries, and suggestion explanations).

### Dynamic memory engine behavior

- Memory extraction runs from the current scene during autosave and via **Refresh memory from current scene** in the Memory tab.
- New candidate memories are consolidated (create/update/reinforce/contradiction state) instead of simple append-only notes.
- Retrieval builds an active memory slate using hybrid reranking (trait score + lexical/entity overlap + pin/state effects).
- Memory objects are directly editable with controls for pin, demote, archive, ambiguity, wrong/contradicted, and delete.

### Build desktop bundles

```bash
npm run build
```

### Package distributable macOS app

```bash
npm run package
```

## Repository structure

- `electron/` – desktop shell, IPC, dependency checks, installer hooks, SQLite bridge
- `src/app` – app root and global Zustand store
- `src/features/onboarding` – first-run setup UX
- `src/features/layout` – workspace shell, toolbar, status bar
- `src/features/project` – left structure sidebar
- `src/features/editor` – TipTap writing environment
- `src/features/ai` – right panel tabs (suggestions/query/memory/actions/settings)
- `src/lib` – formatting parser and memory scoring engine
- `src/types` – typed domain models and global API contracts

## Next extension points

- Drag-and-drop tree reordering with persisted ordering
- Rich semantic node extensions for chapter/scene break blocks
- Background workers for memory extraction/indexing
- Provider abstraction for local/remote AI backends with streaming responses
- Additional export formats (DOCX, EPUB, PDF)
