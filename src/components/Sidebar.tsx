import { useEffect, useRef, useState } from 'react'
import { useActiveDoc, useEditor, useSelectedElements, type SidebarTab } from '../store/useEditor'
import { TEMPLATES } from '../templates'
import { barcode, ellipse, image, line, perforation, rect, text } from '../templates/builders'
import { fileToDataURL } from '../lib/images'
import { renderTicketToDataURL } from '../lib/render'
import type { TicketDocument } from '../types'
import { ColorInput, Field, NumberInput, Select, Slider } from './controls'
import { inch } from '../types'

const TABS: { id: SidebarTab; label: string; icon: string }[] = [
  { id: 'templates', label: 'Templates', icon: '▦' },
  { id: 'text', label: 'Text', icon: 'T' },
  { id: 'elements', label: 'Elements', icon: '◆' },
  { id: 'uploads', label: 'Uploads', icon: '⇪' },
  { id: 'background', label: 'Background', icon: '▣' },
  { id: 'tickets', label: 'Tickets', icon: '🎟' },
]

export default function Sidebar() {
  const tab = useEditor((s) => s.sidebarTab)
  const setTab = useEditor((s) => s.setSidebarTab)
  return (
    <aside className="sidebar">
      <nav className="sidebar-tabs" aria-label="Editor panels">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="tab-icon" aria-hidden>
              {t.icon}
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-panel">
        {tab === 'templates' && <TemplatesPanel />}
        {tab === 'text' && <TextPanel />}
        {tab === 'elements' && <ElementsPanel />}
        {tab === 'uploads' && <UploadsPanel />}
        {tab === 'background' && <BackgroundPanel />}
        {tab === 'tickets' && <TicketsPanel />}
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------ templates */

const thumbCache = new Map<string, string>()

function useTemplateThumb(id: string, build: () => TicketDocument) {
  const [src, setSrc] = useState(thumbCache.get(id))
  useEffect(() => {
    if (thumbCache.has(id)) return
    let active = true
    renderTicketToDataURL(build(), { pixelRatio: 0.16, mimeType: 'image/png' })
      .then((u) => {
        thumbCache.set(id, u)
        if (active) setSrc(u)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [id, build])
  return src
}

function TemplateCard({ t, onPick }: { t: (typeof TEMPLATES)[number]; onPick: () => void }) {
  const thumb = useTemplateThumb(t.id, t.build)
  return (
    <button className="template-card" onClick={onPick} title={`Add a new "${t.name}" ticket`}>
      <div className="template-thumb" style={{ aspectRatio: `${t.width} / ${t.height}` }}>
        {thumb ? <img src={thumb} alt="" /> : <div className="thumb-skeleton" />}
      </div>
      <div className="template-meta">
        <strong>{t.name}</strong>
        <span>{t.description}</span>
      </div>
    </button>
  )
}

function TemplatesPanel() {
  const addTicketFromTemplate = useEditor((s) => s.addTicketFromTemplate)
  const replaceProject = useEditor((s) => s.replaceProject)
  const project = useEditor((s) => s.project)
  const [mode, setMode] = useState<'add' | 'replace'>('replace')

  const pick = (id: string) => {
    if (mode === 'add') {
      addTicketFromTemplate(id)
      return
    }
    const t = TEMPLATES.find((x) => x.id === id)
    if (!t) return
    const fresh = t.build()
    replaceProject({
      tickets: project.tickets.map((tk) => (tk.id === project.activeId ? { ...fresh, id: tk.id } : tk)),
      activeId: project.activeId,
    })
  }

  return (
    <div>
      <h3 className="panel-title">Templates</h3>
      <p className="panel-help">Pick a starting point, then click any text to edit it.</p>
      <div className="segmented">
        <button className={mode === 'replace' ? 'active' : ''} onClick={() => setMode('replace')}>
          Replace current
        </button>
        <button className={mode === 'add' ? 'active' : ''} onClick={() => setMode('add')}>
          Add as new ticket
        </button>
      </div>
      <div className="template-grid">
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.id} t={t} onPick={() => pick(t.id)} />
        ))}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- text */

function TextPanel() {
  const doc = useActiveDoc()
  const addElement = useEditor((s) => s.addElement)
  const cx = doc.width / 2
  const cy = doc.height / 2

  const add = (preset: 'heading' | 'subheading' | 'body' | 'label') => {
    const presets = {
      heading: { text: 'Add a heading', fontFamily: 'Bebas Neue', fontSize: 120, width: Math.min(1200, doc.width - 120), height: 130 },
      subheading: { text: 'Add a subheading', fontFamily: 'Oswald', fontSize: 56, width: Math.min(900, doc.width - 120), height: 70 },
      body: { text: 'Add a little body text', fontFamily: 'Inter', fontSize: 34, width: Math.min(800, doc.width - 120), height: 50 },
      label: { text: 'LABEL', fontFamily: 'Oswald', fontSize: 28, width: 400, height: 40 },
    }[preset]
    addElement(
      text(
        { x: Math.round(cx - presets.width / 2), y: Math.round(cy - presets.height / 2), width: presets.width, height: presets.height },
        { text: presets.text, fontFamily: presets.fontFamily, fontSize: presets.fontSize, fill: '#111111', letterSpacing: preset === 'label' ? 6 : 0, fontStyle: preset === 'label' ? 'bold' : 'normal' },
      ),
    )
  }

  return (
    <div>
      <h3 className="panel-title">Text</h3>
      <p className="panel-help">Double-click text on the canvas to edit it in place.</p>
      <div className="stack">
        <button className="text-preset heading" onClick={() => add('heading')}>Add a heading</button>
        <button className="text-preset subheading" onClick={() => add('subheading')}>Add a subheading</button>
        <button className="text-preset body" onClick={() => add('body')}>Add a little body text</button>
        <button className="text-preset label" onClick={() => add('label')}>ADD A LABEL</button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- elements */

function ElementsPanel() {
  const doc = useActiveDoc()
  const addElement = useEditor((s) => s.addElement)
  const cx = doc.width / 2
  const cy = doc.height / 2
  const items: { label: string; icon: React.ReactNode; make: () => Parameters<typeof addElement>[0] }[] = [
    { label: 'Rectangle', icon: <span className="el-icon rect" />, make: () => rect({ x: cx - 200, y: cy - 120, width: 400, height: 240 }, { fill: '#7c3aed' }) },
    { label: 'Rounded', icon: <span className="el-icon rounded" />, make: () => rect({ x: cx - 200, y: cy - 120, width: 400, height: 240 }, { fill: '#f2c14e', cornerRadius: 40 }) },
    { label: 'Outline', icon: <span className="el-icon outline" />, make: () => rect({ x: cx - 200, y: cy - 120, width: 400, height: 240 }, { fill: '', stroke: '#111111', strokeWidth: 6, cornerRadius: 12 }) },
    { label: 'Circle', icon: <span className="el-icon circle" />, make: () => ellipse({ x: cx - 120, y: cy - 120, width: 240, height: 240 }, { fill: '#ef4444' }) },
    { label: 'Line', icon: <span className="el-icon line" />, make: () => line({ x: cx - 300, y: cy, width: 600, height: 0 }, { stroke: '#111111', strokeWidth: 6 }) },
    { label: 'Dashed line', icon: <span className="el-icon dashed" />, make: () => line({ x: cx - 300, y: cy, width: 600, height: 0 }, { stroke: '#111111', strokeWidth: 4, dash: [20, 14] }) },
    { label: 'Perforation', icon: <span className="el-icon perforation" />, make: () => perforation({ x: Math.round(doc.width * 0.75), y: 30, width: 0, height: doc.height - 60 }, { stroke: '#111111' }) },
    { label: 'Perforation (horizontal)', icon: <span className="el-icon perforation-h" />, make: () => perforation({ x: 30, y: Math.round(doc.height * 0.75), width: doc.width - 60, height: 0 }, { stroke: '#111111', orientation: 'horizontal' }) },
    { label: 'Barcode', icon: <span className="el-icon barcode" />, make: () => barcode({ x: cx - 200, y: cy - 75, width: 400, height: 150 }, { seed: String(Date.now()), text: String(Math.floor(1e9 + Math.random() * 9e9)) }) },
    { label: 'Punch hole', icon: <span className="el-icon hole" />, make: () => ellipse({ x: cx - 40, y: 40, width: 80, height: 80 }, { fill: '#ffffff', stroke: '#cccccc', strokeWidth: 2 }) },
  ]
  return (
    <div>
      <h3 className="panel-title">Elements</h3>
      <p className="panel-help">Shapes, dividers and decorations. Adjust colours in the right panel.</p>
      <div className="element-grid">
        {items.map((it) => (
          <button key={it.label} className="element-card" onClick={() => addElement(it.make())} title={it.label}>
            {it.icon}
            <span>{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- uploads */

const UPLOADS_KEY = 'ticket-stub-creator:uploads:v1'

function loadUploads(): string[] {
  try {
    return JSON.parse(localStorage.getItem(UPLOADS_KEY) || '[]')
  } catch {
    return []
  }
}

function UploadsPanel() {
  const doc = useActiveDoc()
  const addElement = useEditor((s) => s.addElement)
  const selected = useSelectedElements()
  const updateElement = useEditor((s) => s.updateElement)
  const [uploads, setUploads] = useState<string[]>(loadUploads)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const saveUploads = (list: string[]) => {
    setUploads(list)
    try {
      localStorage.setItem(UPLOADS_KEY, JSON.stringify(list))
    } catch {
      /* storage full: keep in memory only */
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    setError(null)
    try {
      const urls: string[] = []
      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) continue
        urls.push(await fileToDataURL(f))
      }
      if (urls.length) {
        saveUploads([...urls, ...uploads].slice(0, 24))
        if (urls.length === 1) place(urls[0])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read image')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const selectedImage = selected.length === 1 && selected[0].type === 'image' ? selected[0] : null

  const place = (src: string) => {
    if (selectedImage) {
      updateElement(selectedImage.id, { src })
      return
    }
    const img = new Image()
    img.onload = () => {
      const maxW = doc.width * 0.5
      const maxH = doc.height * 0.8
      const r = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1.5)
      const w = Math.round(img.naturalWidth * r)
      const h = Math.round(img.naturalHeight * r)
      addElement(image({ x: Math.round((doc.width - w) / 2), y: Math.round((doc.height - h) / 2), width: w, height: h }, src))
    }
    img.src = src
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        void handleFiles(e.dataTransfer.files)
      }}
    >
      <h3 className="panel-title">Uploads</h3>
      <p className="panel-help">
        {selectedImage ? 'An image is selected: click an upload to replace it.' : 'Add photos, logos or artwork. Drag and drop works too.'}
      </p>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => void handleFiles(e.target.files)} />
      <button className="btn primary block" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? 'Reading…' : 'Upload image'}
      </button>
      {error && <p className="error-text">{error}</p>}
      <div className="upload-grid">
        {uploads.map((u, i) => (
          <div key={i} className="upload-item">
            <button className="upload-thumb" onClick={() => place(u)} title="Add to ticket">
              <img src={u} alt="" />
            </button>
            <button className="upload-remove" onClick={() => saveUploads(uploads.filter((_, j) => j !== i))} title="Remove from uploads" aria-label="Remove upload">
              ×
            </button>
          </div>
        ))}
      </div>
      {!uploads.length && <p className="panel-help muted">No uploads yet.</p>}
    </div>
  )
}

/* ----------------------------------------------------------- background */

const SWATCHES = ['#ffffff', '#f6ecd9', '#fde68a', '#f2c14e', '#fca5a5', '#b3261e', '#86efac', '#0f7a3d', '#93c5fd', '#0d2a52', '#c4b5fd', '#5b21b6', '#1b1f3a', '#111111']

const SIZE_PRESETS = [
  { label: 'Classic stub · 5.5 × 2 in', w: inch(5.5), h: inch(2) },
  { label: 'Cinema · 5.5 × 2.25 in', w: inch(5.5), h: inch(2.25) },
  { label: 'Sports · 6 × 2.5 in', w: inch(6), h: inch(2.5) },
  { label: 'Boarding pass · 7.5 × 3 in', w: inch(7.5), h: inch(3) },
  { label: 'Wide · 8 × 3 in', w: inch(8), h: inch(3) },
  { label: 'Portrait pass · 3.5 × 5.5 in', w: inch(3.5), h: inch(5.5) },
  { label: 'Postcard · 6 × 4 in', w: inch(6), h: inch(4) },
]

function BackgroundPanel() {
  const doc = useActiveDoc()
  const setBackground = useEditor((s) => s.setBackground)
  const setDocProps = useEditor((s) => s.setDocProps)
  const bg = doc.background
  const presetValue = SIZE_PRESETS.find((p) => p.w === doc.width && p.h === doc.height)?.label ?? 'custom'

  return (
    <div>
      <h3 className="panel-title">Background &amp; size</h3>
      <Field label="Style">
        <Select
          value={bg.type}
          onChange={(v) => setBackground({ type: v, color2: bg.color2 ?? '#7c3aed', angle: bg.angle ?? 90 })}
          options={[
            { value: 'solid', label: 'Solid colour' },
            { value: 'gradient', label: 'Gradient' },
          ]}
        />
      </Field>
      <Field label={bg.type === 'gradient' ? 'Colour 1' : 'Colour'}>
        <ColorInput value={bg.color} onChange={(c) => setBackground({ color: c }, 'bg-color')} />
      </Field>
      {bg.type === 'gradient' && (
        <>
          <Field label="Colour 2">
            <ColorInput value={bg.color2 ?? '#7c3aed'} onChange={(c) => setBackground({ color2: c }, 'bg-color2')} />
          </Field>
          <Field label="Angle">
            <Slider value={bg.angle ?? 90} min={0} max={360} onChange={(v) => setBackground({ angle: v }, 'bg-angle')} />
          </Field>
        </>
      )}
      <div className="swatches">
        {SWATCHES.map((c) => (
          <button key={c} className="swatch" style={{ background: c }} onClick={() => setBackground({ color: c })} title={c} aria-label={`Set colour ${c}`} />
        ))}
      </div>

      <h3 className="panel-title">Ticket size</h3>
      <Field label="Preset">
        <Select
          value={presetValue}
          onChange={(v) => {
            const p = SIZE_PRESETS.find((x) => x.label === v)
            if (p) setDocProps({ width: p.w, height: p.h })
          }}
          options={[{ value: 'custom', label: 'Custom' }, ...SIZE_PRESETS.map((p) => ({ value: p.label, label: p.label }))]}
        />
      </Field>
      <div className="row">
        <Field label="Width">
          <NumberInput value={Math.round((doc.width / 300) * 100) / 100} min={1} max={12} step={0.25} suffix="in" onChange={(v) => setDocProps({ width: inch(v) }, 'doc-w')} />
        </Field>
        <Field label="Height">
          <NumberInput value={Math.round((doc.height / 300) * 100) / 100} min={1} max={12} step={0.25} suffix="in" onChange={(v) => setDocProps({ height: inch(v) }, 'doc-h')} />
        </Field>
      </div>
      <Field label="Corner radius">
        <Slider value={doc.cornerRadius} min={0} max={150} onChange={(v) => setDocProps({ cornerRadius: v }, 'doc-radius')} />
      </Field>
    </div>
  )
}

/* -------------------------------------------------------------- tickets */

export function useTicketThumb(doc: TicketDocument) {
  const [src, setSrc] = useState<string>()
  const key = JSON.stringify(doc)
  useEffect(() => {
    let active = true
    const t = setTimeout(() => {
      renderTicketToDataURL(doc, { pixelRatio: 0.12 })
        .then((u) => active && setSrc(u))
        .catch(() => {})
    }, 250)
    return () => {
      active = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return src
}

function TicketRow({ t, active }: { t: TicketDocument; active: boolean }) {
  const thumb = useTicketThumb(t)
  const { setActiveTicket, duplicateTicket, removeTicket, project, setDocProps } = useEditor()
  return (
    <div className={`ticket-row ${active ? 'active' : ''}`}>
      <button className="ticket-row-main" onClick={() => setActiveTicket(t.id)}>
        <div className="ticket-row-thumb" style={{ aspectRatio: `${t.width} / ${t.height}` }}>{thumb && <img src={thumb} alt="" />}</div>
      </button>
      <div className="ticket-row-meta">
        {active ? (
          <input className="ticket-name" value={t.name} onChange={(e) => setDocProps({ name: e.target.value }, 'doc-name')} aria-label="Ticket name" />
        ) : (
          <button className="ticket-name-btn" onClick={() => setActiveTicket(t.id)}>
            {t.name}
          </button>
        )}
        <div className="ticket-row-actions">
          <button className="btn tiny" onClick={() => duplicateTicket(t.id)} title="Duplicate ticket">
            Duplicate
          </button>
          <button className="btn tiny danger" onClick={() => removeTicket(t.id)} disabled={project.tickets.length <= 1} title="Delete ticket">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function TicketsPanel() {
  const project = useEditor((s) => s.project)
  const setTab = useEditor((s) => s.setSidebarTab)
  return (
    <div>
      <h3 className="panel-title">Tickets in this project</h3>
      <p className="panel-help">Make a ticket for each person, then print them all on one page.</p>
      <div className="stack">
        {project.tickets.map((t) => (
          <TicketRow key={t.id} t={t} active={t.id === project.activeId} />
        ))}
      </div>
      <button className="btn block" onClick={() => setTab('templates')} style={{ marginTop: 12 }}>
        + New ticket from template
      </button>
    </div>
  )
}
