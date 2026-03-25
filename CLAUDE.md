# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Infinite Heroes is an AI-powered comic book creator that uses Google's Gemini AI models to generate comic narratives and artwork. Users create characters, configure story settings, and generate complete comic issues with two modes: **Novel Mode** (interactive choice-based) and **Outline Mode** (fully automated from plot outline).

## Build & Development Commands

```bash
npm run dev      # Start Vite development server (localhost:3000)
npm run build    # Production build to dist/
npm run preview  # Preview production build
npm run lint     # TypeScript type checking (tsc --noEmit)
```

## Architecture

### File Structure
All source files are in the **root directory** (no `src/` folder). This is intentional for Vite's flat structure.

### Core Files

- **index.tsx** - React entry point, mounts App
- **App.tsx** - Main orchestrator (~1700 lines). Contains:
  - All state management (characters, story context, comic pages)
  - AI generation logic (beats, images, profiles, outlines)
  - Export/import draft functionality
  - API key management flow
- **types.ts** - All TypeScript interfaces and configuration constants (genres, art styles, languages, page lengths)
- **useApiKey.ts** - Custom hook for AI Studio API key integration

### Component Hierarchy

```
App
├── Setup (character/story configuration, shown initially)
├── Book (comic reader with page-flip)
│   └── Panel (individual page rendering, decisions, actions)
├── ProfilesDialog (character profile review before generation)
├── OutlineStepDialog (outline mode editing)
├── RerollModal (regenerate specific panels)
├── GalleryModal (view all pages)
├── ExportDialog (PDF/image export)
└── SettingsDialog (API key config)
```

### AI Models Used

- **gemini-2.5-pro** - Text/narrative generation (beats, outlines)
- **gemini-3-pro-image-preview** - Image generation (panels, covers)

### Key Data Types (from types.ts)

- **Persona** - Character definition (portrait, refs, backstory, role)
- **StoryContext** - Story metadata (title, genre, art style, publisher info)
- **ComicFace** - Single comic page state (image, narrative, choices)
- **Beat** - Narrative unit (caption, dialogue, scene description, focus character)
- **CharacterProfile** - AI-analyzed visual profile for consistency

### Generation Flow

1. User configures cast (hero, co-star, additional characters) and story settings
2. App generates CharacterProfiles by analyzing uploaded portraits
3. In Outline Mode: AI generates full story outline for user review
4. Cover is generated first, then story pages in batches
5. Novel Mode: Pauses at decision pages (configurable in `getComicConfig()`)
6. Each panel: `generateBeat()` creates narrative → `generateImage()` creates visual

### Path Alias

`@/*` maps to `./` (root directory) via tsconfig.json

## Environment Variables

- `GEMINI_API_KEY` - Google AI Studio API key
- `ADMIN_PASSWORD` - Admin dashboard password (for server-side key)

## Key Implementation Notes

- Character consistency relies on multi-layered prompt enforcement: reference images, character profiles, and scene descriptions all explicitly name characters
- Draft files are JSON containing full state (characters, pages, settings) - can be large due to base64 images
- LocalStorage persists cast data between sessions (strips images if >4MB)
- The `getComicConfig()` function dynamically calculates page structure based on story length

## Git Conventions

**Do NOT commit the following folders:**
- `research/` - Contains planning documents and implementation notes (local reference only)
- `.claude/` - Claude Code session data and auto-generated files

When staging files for commit, explicitly add only source files or use:
```bash
git add App.tsx Setup.tsx types.ts RerollModal.tsx ModeSelectionScreen.tsx  # etc.
```

Avoid `git add -A` or `git add .` which may accidentally include these folders.
