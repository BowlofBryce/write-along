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
