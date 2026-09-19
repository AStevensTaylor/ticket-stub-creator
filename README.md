# Ticket Stub Creator

A browser-based editor for designing commemorative ticket stubs to give as gifts.
Pick a template, drop in photos and text Canva-style, then save the ticket as an
image or print one or many tickets to a single page.

Built with React, TypeScript, Vite and Konva, and deployed as a Cloudflare Worker
with static assets.

## Features

- **Templates** — Concert, Cinema, Sports, Golden Ticket, Boarding Pass, Event Pass
  (portrait) and Blank. Replace the current ticket or add a new one to the project.
- **Canva-style editing** — drag, resize and rotate anything; double-click text to
  edit in place; snapping guides to canvas edges, centres and other elements;
  multi-select with Shift; layer ordering; lock, duplicate, copy and paste.
- **Elements** — text, uploaded images (fill / fit / stretch, rounded corners,
  border), rectangles, ellipses, lines, perforation lines, decorative barcodes.
- **Background & size** — solid or gradient backgrounds, rounded corners, several
  ticket-size presets or a custom size in inches (300 DPI).
- **Multiple tickets per project** — make one per recipient, autosaved to the
  browser, or save/open the whole project as a `.json` file.
- **Save as image** — PNG (transparent rounded corners) or JPEG at 150/300/600 DPI,
  one ticket or all tickets; copy PNG to the clipboard.
- **Print** — choose paper (Letter, Legal, Tabloid, A4, A3), orientation, margins,
  gap, print scale and rotation; set copies per ticket; tickets are packed onto as
  few pages as possible at true physical size with optional dashed outlines or crop
  marks for cutting. Uses the browser print dialog, so "Save as PDF" works too.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| Ctrl/Cmd + Z, Ctrl/Cmd + Y | Undo, redo |
| Ctrl/Cmd + D | Duplicate |
| Ctrl/Cmd + C / V | Copy / paste |
| Ctrl/Cmd + A | Select all |
| Delete / Backspace | Delete |
| Arrow keys (+ Shift) | Nudge |
| Ctrl/Cmd + ] / [ (+ Shift) | Layer forward / backward (front / back) |
| Ctrl/Cmd + scroll, Ctrl/Cmd + / − / 0 | Zoom, fit |
| Esc | Deselect / finish text editing |

## Development

```sh
npm install
npm run dev        # Vite dev server with the Cloudflare plugin
npm run build      # type-check and build to dist/
npm run preview    # preview the production build
npm run lint
```

## Deploying to Cloudflare Workers

The app is a static single-page application served through Workers Static Assets.
`worker/index.ts` is a tiny Worker that serves the assets, adds security headers
and answers `/healthz`. Configuration lives in `wrangler.jsonc`.

```sh
npx wrangler login   # once
npm run deploy       # builds, then `wrangler deploy`
```

To change the Worker name or add a custom domain, edit `wrangler.jsonc` (see the
[Workers Static Assets docs](https://developers.cloudflare.com/workers/static-assets/)).

## Project layout

```
worker/index.ts            Cloudflare Worker entry
src/types.ts               Document and element model (300 DPI pixels)
src/templates/             Ticket templates and element builders
src/store/useEditor.ts     Zustand store: project, selection, undo/redo, autosave
src/components/
  CanvasEditor.tsx         Konva stage, selection, dragging, snapping, inline text
  TicketLayer.tsx          Element renderers (shared by editor, thumbnails, export)
  Sidebar.tsx              Templates / Text / Elements / Uploads / Background / Tickets
  PropertiesPanel.tsx      Per-element property editing
  ExportDialog.tsx         Save as PNG / JPEG
  PrintDialog.tsx          Print layout and preview
src/lib/print.ts           Page packing and print-sheet HTML
src/lib/render.tsx         Offscreen rendering of a ticket to a data URL
```

Web fonts are loaded from Google Fonts; if they are unavailable the editor falls
back to system fonts.
