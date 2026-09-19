import { useRef } from 'react'
import { useActiveDoc, useEditor, type Project } from '../store/useEditor'
import { downloadText, safeFilename } from '../lib/download'

export default function TopBar({ onExport, onPrint }: { onExport: () => void; onPrint: () => void }) {
  const doc = useActiveDoc()
  const { undo, redo, past, future, setDocProps, project, replaceProject } = useEditor()
  const fileRef = useRef<HTMLInputElement>(null)

  const saveProject = () => {
    downloadText(JSON.stringify(project, null, 2), `${safeFilename(doc.name)}-project.json`)
  }

  const openProject = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Project | { elements?: unknown }
      if ('tickets' in parsed && Array.isArray(parsed.tickets) && parsed.tickets.length) {
        replaceProject(parsed as Project)
      } else if ('elements' in parsed) {
        const single = parsed as unknown as Project['tickets'][number]
        replaceProject({ tickets: [single], activeId: single.id })
      } else {
        throw new Error('bad file')
      }
    } catch {
      alert('That file is not a ticket project.')
    }
  }

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-icon" aria-hidden>🎟</span>
        <span className="brand-name">Ticket Stub Creator</span>
      </div>
      <div className="topbar-center">
        <button className="btn ghost" onClick={undo} disabled={!past.length} title="Undo (Ctrl+Z)">↶ Undo</button>
        <button className="btn ghost" onClick={redo} disabled={!future.length} title="Redo (Ctrl+Y)">↷ Redo</button>
        <input className="doc-name" value={doc.name} onChange={(e) => setDocProps({ name: e.target.value }, 'doc-name')} aria-label="Ticket name" />
      </div>
      <div className="topbar-right">
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && void openProject(e.target.files[0])} />
        <button className="btn ghost" onClick={() => fileRef.current?.click()} title="Open a saved project file">Open</button>
        <button className="btn ghost" onClick={saveProject} title="Save project as a file you can re-open later">Save project</button>
        <button className="btn" onClick={onExport} title="Download as PNG or JPEG">Save image</button>
        <button className="btn primary" onClick={onPrint} title="Print one or many tickets per page">Print</button>
      </div>
    </header>
  )
}
