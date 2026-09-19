import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditor } from '../store/useEditor'
import { renderTicketToDataURL } from '../lib/render'
import { buildPrintHTML, DEFAULT_PRINT_SETTINGS, layoutPrint, PAPERS, printHTML, rotateDataURL, type PaperId, type PrintSettings } from '../lib/print'
import { Field, Modal, NumberInput, Select, Slider } from './controls'

type Images = Record<string, { normal: string; rotated?: string }>

export default function PrintDialog({ onClose }: { onClose: () => void }) {
  const project = useEditor((s) => s.project)
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS)
  const [copies, setCopies] = useState<Record<string, number>>(() =>
    Object.fromEntries(project.tickets.map((t) => [t.id, t.id === project.activeId ? 1 : 0])),
  )
  const [previews, setPreviews] = useState<Images>({})
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const fullImages = useRef<Images>({})

  const set = <K extends keyof PrintSettings>(k: K, v: PrintSettings[K]) => setSettings((s) => ({ ...s, [k]: v }))

  const items = useMemo(() => project.tickets.map((doc) => ({ doc, copies: copies[doc.id] ?? 0 })).filter((i) => i.copies > 0), [project.tickets, copies])
  const layout = useMemo(() => layoutPrint(items, settings), [items, settings])
  const total = items.reduce((a, b) => a + b.copies, 0)

  // Low-res previews for the on-screen layout.
  useEffect(() => {
    let active = true
    ;(async () => {
      const out: Images = {}
      for (const t of project.tickets) {
        if (!(copies[t.id] > 0)) continue
        const normal = await renderTicketToDataURL(t, { pixelRatio: 0.2 })
        out[t.id] = { normal, rotated: settings.rotate ? await rotateDataURL(normal) : undefined }
      }
      if (active) setPreviews(out)
    })().catch(() => {})
    return () => {
      active = false
    }
  }, [project.tickets, copies, settings.rotate])

  const doPrint = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const images: Images = {}
      for (const it of items) {
        const cached = fullImages.current[it.doc.id]
        const normal = cached?.normal ?? (await renderTicketToDataURL(it.doc, { pixelRatio: 1 }))
        const rotated = settings.rotate ? cached?.rotated ?? (await rotateDataURL(normal)) : undefined
        images[it.doc.id] = { normal, rotated }
        fullImages.current[it.doc.id] = images[it.doc.id]
      }
      const html = buildPrintHTML(layout, images, settings, 'Ticket stubs')
      await printHTML(html)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Print failed')
    } finally {
      setBusy(false)
    }
  }

  // Invalidate the full-res cache whenever documents change.
  useEffect(() => {
    fullImages.current = {}
  }, [project.tickets])

  const ppi = 26 // preview pixels per inch
  const paper = PAPERS[settings.paper]
  const pageW = settings.orientation === 'portrait' ? paper.width : paper.height
  const pageH = settings.orientation === 'portrait' ? paper.height : paper.width
  const perPage = layout.pages[0]?.items.length ?? 0

  return (
    <Modal title="Print tickets" onClose={onClose} width={960}>
      <div className="print-dialog">
        <div className="print-settings">
          <h4>Tickets &amp; copies</h4>
          <div className="stack">
            {project.tickets.map((t) => (
              <div key={t.id} className="copies-row">
                <span className="copies-name" title={t.name}>{t.name}</span>
                <span className="copies-size">{(t.width / 300).toFixed(1)}×{(t.height / 300).toFixed(1)} in</span>
                <NumberInput value={copies[t.id] ?? 0} min={0} max={200} onChange={(v) => setCopies((c) => ({ ...c, [t.id]: Math.round(v) }))} />
              </div>
            ))}
          </div>

          <h4>Page</h4>
          <Field label="Paper">
            <Select value={settings.paper} onChange={(v) => set('paper', v as PaperId)} options={(Object.keys(PAPERS) as PaperId[]).map((k) => ({ value: k, label: PAPERS[k].label }))} />
          </Field>
          <Field label="Orientation">
            <Select value={settings.orientation} onChange={(v) => set('orientation', v)} options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} />
          </Field>
          <div className="row">
            <Field label="Margin (in)">
              <NumberInput value={settings.margin} min={0} max={2} step={0.05} onChange={(v) => set('margin', v)} />
            </Field>
            <Field label="Gap (in)">
              <NumberInput value={settings.gap} min={0} max={2} step={0.05} onChange={(v) => set('gap', v)} />
            </Field>
          </div>
          <Field label={`Print size: ${Math.round(settings.scale * 100)}%`}>
            <Slider value={settings.scale} min={0.25} max={2} step={0.05} onChange={(v) => set('scale', v)} />
          </Field>
          <Field label="Rotate tickets 90°" inline>
            <input type="checkbox" checked={settings.rotate} onChange={(e) => set('rotate', e.target.checked)} />
          </Field>
          <Field label="Cut guides">
            <Select value={settings.guides} onChange={(v) => set('guides', v)} options={[{ value: 'none', label: 'None' }, { value: 'dashed', label: 'Dashed outline' }, { value: 'crop', label: 'Crop marks' }]} />
          </Field>
        </div>

        <div className="print-preview">
          <div className="print-summary">
            {total === 0 ? (
              <span>Choose at least one copy to print.</span>
            ) : (
              <span>
                {total} ticket{total !== 1 ? 's' : ''} on {layout.pages.length} page{layout.pages.length !== 1 ? 's' : ''}
                {perPage > 0 && ` · up to ${perPage} per page`}
                {layout.skipped > 0 && ` · ${layout.skipped} too large for this paper`}
              </span>
            )}
          </div>
          <div className="print-pages">
            {layout.pages.map((p, i) => (
              <div key={i} className="print-page" style={{ width: pageW * ppi, height: pageH * ppi }}>
                {p.items.map((it, j) => {
                  const img = it.rotated ? previews[it.docId]?.rotated : previews[it.docId]?.normal
                  return (
                    <div
                      key={j}
                      className={`print-item ${settings.guides !== 'none' ? 'guide' : ''}`}
                      style={{ left: it.x * ppi, top: it.y * ppi, width: it.width * ppi, height: it.height * ppi }}
                    >
                      {img && <img src={img} alt="" />}
                    </div>
                  )
                })}
                <span className="print-page-num">Page {i + 1}</span>
              </div>
            ))}
          </div>
          {status && <p className="status-text">{status}</p>}
          <div className="btn-row end">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={doPrint} disabled={busy || total === 0 || layout.pages.length === 0}>
              {busy ? 'Preparing…' : 'Print / Save PDF'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
