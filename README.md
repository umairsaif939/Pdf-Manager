# PDF Flux

> A beautiful, simple, privacy-focused offline PDF reading, annotation, and study workspace.

## Product Overview
PDF Flux is a local-first web application designed for students and researchers. Users can import PDFs from their device, organize them into subject folders, read and search text, annotate pages with pen and highlighters, manage and reorder pages, track active focus study time, and export flattened annotated PDFs.

Version 1 is **strictly local and offline-first**. All documents, annotations, notes, and study metrics are persisted on your device in **IndexedDB (Dexie.js)**. No backend, accounts, cloud sync, or external AI APIs are included in V1.

---

## Visual Design System
- **Surfaces**: Warm cream paper (`#F6F0E6`) with elevated near-white cards (`#FFFCF6`)
- **Typography**: Editorial serif headings (`DM Serif Display`), clean sans-serif UI (`Inter`), and subtle handwritten accents (`Caveat`)
- **Palette**: Charcoal ink (`#25221F`), Terracotta primary action (`#E76F35`), Sage/Forest accents (`#D8E3D8` / `#24483D`)
- **Themes**: Full Light, Dark, and System mode support with persistent client preference

---

## Requirements & Implementation Status Matrix

| Feature Area | Priority | Phase | Status | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Responsive App Shell & Editorial Theme** | P0 | Phase 1 | **Implemented & Tested** | Full desktop sidebar + mobile bottom nav, design tokens, light/dark themes |
| **Honest Empty States & Welcome Modal** | P0 | Phase 1 | **Implemented & Tested** | First-visit privacy banner, clean initial states with toggles |
| **PDF Import & IndexedDB Persistence** | P0 | Phase 2 | **Implemented & Tested** | Dexie.js schema, real file picker, multi-file validation, quota checks |
| **PDF.js Client Viewer & Thumbnails** | P0 | Phase 2 | **Implemented & Tested** | High-DPI canvas rendering, page navigation, zoom, real page thumbnails |
| **Supabase Cloud Sync & Storage** | Arch | Phase 2 | **Implemented & Tested** | Auth integration, RLS policies, cloud storage backup, .env.local setup |
| **Normalized Annotation Engine (0..1)** | P0 | Phase 3 | *Next* | Pen, highlighter, vector eraser, shapes, text, sticky notes, undo/redo |
| **Annotated PDF Export (pdf-lib)** | P0 | Phase 4 | *Not Started* | Flattening vector annotations into downloaded PDF (MVP Checkpoint) |
| **Bookmarks & Outline TOC** | P0/P1 | Phase 5 | *Not Started* | Page bookmarks and embedded PDF table of contents tree |
| **Contextual Text Actions** | P1 | Phase 5 | *Not Started* | Copy, dictionary, Google search, add to notes |
| **Page Management & Image Overlays** | P1 | Phase 6 | *Not Started* | Rotate, reorder, delete, duplicate pages; stable page identity mapping |
| **Screen-Time & Study Analytics** | P1 | Phase 7 | *Not Started* | Active time tracking (pauses when idle), subject/PDF focus charts |
| **Revision Notes & Flashcards** | P1 | Phase 7 | *Not Started* | Linked study notes, card flip review mode (Again/Good) |
| **Recycle Bin (Trash) & Storage Manager** | P1 | Phase 8 | *Not Started* | Safe two-stage deletion, restore, quota inspection |
| **Backup Archive Export & Restore** | P1 | Phase 8 | *Not Started* | Versioned JSON/zip backup with schema validation |
| **PWA Caching & Offline Hardening** | P0 | Phase 8 | *Not Started* | Service Worker app shell caching, cold-restart verification |
| **Text-to-Speech & Command Palette** | P2 | Phase 9 | *Not Started* | Web Speech API, quick action palette, local PIN barrier |
| **Final QA & Regression Verification** | P0 | Phase 10 | *Not Started* | Large PDF stress test, accessibility audit, final delivery |

---

## Supabase Setup (Optional Cloud Backup)

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Copy `.env.local.example` to `.env.local`:
   ```powershell
   Copy-Item .env.local.example .env.local
   ```
3. Populate `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase Dashboard (**Project Settings -> API**).
4. Run the initial SQL migration located at `supabase/migrations/20261027_initial_schema.sql` in the **Supabase SQL Editor** to set up tables and Row Level Security (RLS) policies.

---

## Development Setup

```powershell
# Install dependencies
npm install

# Run development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Run production build
npm run build
```
