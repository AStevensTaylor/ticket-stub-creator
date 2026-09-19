import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Layer, Stage } from 'react-konva'
import type Konva from 'konva'
import type { TicketDocument } from '../types'
import { loadImage } from './images'
import { waitForFonts } from './fonts'
import { StaticTicket } from '../components/TicketLayer'

export interface RenderOptions {
  /** 1 = 300 DPI (native document pixels). 0.5 = 150 DPI, 2 = 600 DPI. */
  pixelRatio?: number
  mimeType?: 'image/png' | 'image/jpeg'
  quality?: number
}

/** Render a ticket document offscreen and return it as a data URL. */
export async function renderTicketToDataURL(doc: TicketDocument, opts: RenderOptions = {}): Promise<string> {
  const { pixelRatio = 1, mimeType = 'image/png', quality = 0.92 } = opts
  await waitForFonts()
  await Promise.all(
    doc.elements.filter((e) => e.type === 'image').map((e) => loadImage(e.src).catch(() => undefined)),
  )

  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-100000px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'
  document.body.appendChild(container)
  const root = createRoot(container)
  let stage: Konva.Stage | null = null

  try {
    flushSync(() => {
      root.render(
        <Stage ref={(s) => { stage = s }} width={doc.width} height={doc.height} listening={false}>
          <Layer listening={false}>
            {mimeType === 'image/jpeg' && <JpegBackdrop width={doc.width} height={doc.height} />}
            <StaticTicket doc={doc} />
          </Layer>
        </Stage>,
      )
    })
    // Let react-konva finish attaching nodes.
    await new Promise((r) => setTimeout(r, 0))
    const s = stage as Konva.Stage | null
    if (!s) throw new Error('Stage failed to mount')
    return s.toDataURL({ pixelRatio, mimeType, quality })
  } finally {
    root.unmount()
    container.remove()
  }
}

import { Rect } from 'react-konva'
function JpegBackdrop({ width, height }: { width: number; height: number }) {
  return <Rect width={width} height={height} fill="#ffffff" />
}
