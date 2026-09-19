import { useState } from 'react'
import { useEditor } from '../store/useEditor'
import { renderTicketToDataURL } from '../lib/render'
import { downloadDataURL, safeFilename } from '../lib/download'
import { Field, Modal, Select } from './controls'

const DPI_OPTIONS = [
  { value: '0.5', label: '150 DPI (web / sharing)' },
  { value: '1', label: '300 DPI (print quality)' },
  { value: '2', label: '600 DPI (extra sharp)' },
]

export default function ExportDialog({ onClose }: { onClose: () => void }) {
  const project = useEditor((s) => s.project)
  const active = project.tickets.find((t) => t.id === project.activeId) ?? project.tickets[0]
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png')
  const [ratio, setRatio] = useState('1')
  const [scope, setScope] = useState<'current' | 'all'>('current')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const ext = format === 'image/png' ? 'png' : 'jpg'
  const targets = scope === 'current' ? [active] : project.tickets

  const run = async () => {
    setBusy(true)
    setStatus(null)
    try {
      for (const doc of targets) {
        const url = await renderTicketToDataURL(doc, { pixelRatio: parseFloat(ratio), mimeType: format, quality: 0.92 })
        downloadDataURL(url, `${safeFilename(doc.name)}.${ext}`)
        if (targets.length > 1) await new Promise((r) => setTimeout(r, 300))
      }
      setStatus(`Saved ${targets.length} image${targets.length > 1 ? 's' : ''}.`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  const copyToClipboard = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const url = await renderTicketToDataURL(active, { pixelRatio: parseFloat(ratio), mimeType: 'image/png' })
      const blob = await (await fetch(url)).blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setStatus('Copied to clipboard as PNG.')
    } catch {
      setStatus('Clipboard copy is not available in this browser. Use Download instead.')
    } finally {
      setBusy(false)
    }
  }

  const px = (n: number) => Math.round(n * parseFloat(ratio))

  return (
    <Modal title="Save as image" onClose={onClose} width={480}>
      <Field label="What to save">
        <Select value={scope} onChange={setScope} options={[{ value: 'current', label: `Current ticket (${active.name})` }, { value: 'all', label: `All tickets in project (${project.tickets.length})` }]} />
      </Field>
      <Field label="Format">
        <Select value={format} onChange={setFormat} options={[{ value: 'image/png', label: 'PNG (transparent corners)' }, { value: 'image/jpeg', label: 'JPEG (smaller file)' }]} />
      </Field>
      <Field label="Resolution">
        <Select value={ratio} onChange={setRatio} options={DPI_OPTIONS} />
      </Field>
      <p className="panel-help">
        {active.name}: {px(active.width)} × {px(active.height)} px · {(active.width / 300).toFixed(2)} × {(active.height / 300).toFixed(2)} in
      </p>
      {status && <p className="status-text">{status}</p>}
      <div className="btn-row end">
        <button className="btn" onClick={copyToClipboard} disabled={busy || !('ClipboardItem' in window)}>
          Copy PNG
        </button>
        <button className="btn primary" onClick={run} disabled={busy}>
          {busy ? 'Rendering…' : `Download ${ext.toUpperCase()}`}
        </button>
      </div>
    </Modal>
  )
}
