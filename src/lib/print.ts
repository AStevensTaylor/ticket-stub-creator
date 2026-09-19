import type { TicketDocument } from '../types'
import { DPI } from '../types'

export type PaperId = 'letter' | 'a4' | 'legal' | 'a3' | 'tabloid'
export const PAPERS: Record<PaperId, { label: string; width: number; height: number }> = {
  letter: { label: 'US Letter (8.5 × 11 in)', width: 8.5, height: 11 },
  legal: { label: 'US Legal (8.5 × 14 in)', width: 8.5, height: 14 },
  tabloid: { label: 'Tabloid (11 × 17 in)', width: 11, height: 17 },
  a4: { label: 'A4 (210 × 297 mm)', width: 210 / 25.4, height: 297 / 25.4 },
  a3: { label: 'A3 (297 × 420 mm)', width: 297 / 25.4, height: 420 / 25.4 },
}

export interface PrintItem {
  doc: TicketDocument
  copies: number
}

export interface PrintSettings {
  paper: PaperId
  orientation: 'portrait' | 'landscape'
  margin: number // inches
  gap: number // inches
  scale: number // 1 = actual size
  rotate: boolean // rotate tickets 90° on the page
  guides: 'none' | 'dashed' | 'crop'
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paper: 'letter',
  orientation: 'portrait',
  margin: 0.5,
  gap: 0.25,
  scale: 1,
  rotate: false,
  guides: 'dashed',
}

export interface PlacedTicket {
  docId: string
  x: number // inches from page edge
  y: number
  width: number
  height: number
  rotated: boolean
}

export interface PrintPage {
  width: number
  height: number
  items: PlacedTicket[]
}

export interface PrintLayout {
  pages: PrintPage[]
  /** Tickets that could not fit on a page even alone. */
  skipped: number
}

/** Shelf-pack tickets onto pages in physical inches. */
export function layoutPrint(items: PrintItem[], s: PrintSettings): PrintLayout {
  const paper = PAPERS[s.paper]
  const pageW = s.orientation === 'portrait' ? paper.width : paper.height
  const pageH = s.orientation === 'portrait' ? paper.height : paper.width
  const usableW = pageW - s.margin * 2
  const usableH = pageH - s.margin * 2

  const queue: { docId: string; w: number; h: number; rotated: boolean }[] = []
  for (const it of items) {
    const w0 = (it.doc.width / DPI) * s.scale
    const h0 = (it.doc.height / DPI) * s.scale
    const rotated = s.rotate
    const w = rotated ? h0 : w0
    const h = rotated ? w0 : h0
    for (let i = 0; i < Math.max(0, Math.floor(it.copies)); i++) queue.push({ docId: it.doc.id, w, h, rotated })
  }

  const pages: PrintPage[] = []
  let skipped = 0
  let page: PrintPage | null = null
  let cursorX = 0
  let cursorY = 0
  let rowH = 0

  const newPage = () => {
    page = { width: pageW, height: pageH, items: [] }
    pages.push(page)
    cursorX = 0
    cursorY = 0
    rowH = 0
  }

  for (const t of queue) {
    if (t.w > usableW + 1e-6 || t.h > usableH + 1e-6) {
      skipped++
      continue
    }
    if (!page) newPage()
    // New row?
    if (cursorX + t.w > usableW + 1e-6) {
      cursorX = 0
      cursorY += rowH + s.gap
      rowH = 0
    }
    // New page?
    if (cursorY + t.h > usableH + 1e-6) {
      newPage()
    }
    page!.items.push({ docId: t.docId, x: s.margin + cursorX, y: s.margin + cursorY, width: t.w, height: t.h, rotated: t.rotated })
    cursorX += t.w + s.gap
    rowH = Math.max(rowH, t.h)
  }

  return { pages, skipped }
}

/** Rotate a rendered ticket image 90° clockwise for landscape placement. */
export function rotateDataURL(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalHeight
      c.height = img.naturalWidth
      const ctx = c.getContext('2d')
      if (!ctx) return reject(new Error('no canvas'))
      ctx.translate(c.width, 0)
      ctx.rotate(Math.PI / 2)
      ctx.drawImage(img, 0, 0)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('rotate failed'))
    img.src = src
  })
}

/** Build a standalone HTML document for the print sheet. */
export function buildPrintHTML(layout: PrintLayout, images: Record<string, { normal: string; rotated?: string }>, s: PrintSettings, title: string): string {
  const paper = PAPERS[s.paper]
  const pw = s.orientation === 'portrait' ? paper.width : paper.height
  const ph = s.orientation === 'portrait' ? paper.height : paper.width
  const guideCss =
    s.guides === 'dashed'
      ? '.t{outline:1px dashed #9ca3af;outline-offset:0}'
      : s.guides === 'crop'
        ? `.t{overflow:visible}.t .m{position:absolute;background:#222}.t .m.h{width:0.16in;height:0.5pt}.t .m.v{height:0.16in;width:0.5pt}
           .t .m.tl.h{left:-0.2in;top:-0.5pt}.t .m.tl.v{top:-0.2in;left:-0.5pt}
           .t .m.tr.h{right:-0.2in;top:-0.5pt}.t .m.tr.v{top:-0.2in;right:-0.5pt}
           .t .m.bl.h{left:-0.2in;bottom:-0.5pt}.t .m.bl.v{bottom:-0.2in;left:-0.5pt}
           .t .m.br.h{right:-0.2in;bottom:-0.5pt}.t .m.br.v{bottom:-0.2in;right:-0.5pt}`
        : ''
  const marks =
    s.guides === 'crop'
      ? ['tl', 'tr', 'bl', 'br'].map((c) => `<i class="m h ${c}"></i><i class="m v ${c}"></i>`).join('')
      : ''
  const pages = layout.pages
    .map(
      (p) =>
        `<div class="page">${p.items
          .map((it) => {
            const src = it.rotated ? images[it.docId]?.rotated ?? images[it.docId]?.normal : images[it.docId]?.normal
            return `<div class="t" style="left:${it.x}in;top:${it.y}in;width:${it.width}in;height:${it.height}in"><img src="${src ?? ''}" alt="">${marks}</div>`
          })
          .join('')}</div>`,
    )
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
@page{size:${pw}in ${ph}in;margin:0}
html,body{margin:0;padding:0;background:#fff}
.page{position:relative;width:${pw}in;height:${ph}in;overflow:hidden;page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}
.t{position:absolute;box-sizing:border-box}
.t img{display:block;width:100%;height:100%}
${guideCss}
@media screen{body{background:#666;padding:20px}.page{margin:0 auto 20px;box-shadow:0 2px 12px rgba(0,0,0,.4);background:#fff}}
</style></head><body>${pages}</body></html>`
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)
}

/** Open the print dialog for the given HTML using a hidden iframe. */
export function printHTML(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
    document.body.appendChild(iframe)
    const cleanup = () => {
      setTimeout(() => iframe.remove(), 1000)
      resolve()
    }
    iframe.onload = () => {
      const win = iframe.contentWindow
      if (!win) return cleanup()
      const imgs = Array.from(win.document.images)
      Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r() })))).then(() => {
        win.focus()
        win.onafterprint = cleanup
        win.print()
        // Fallback for browsers that never fire afterprint.
        setTimeout(cleanup, 60000)
      })
    }
    iframe.srcdoc = html
  })
}
