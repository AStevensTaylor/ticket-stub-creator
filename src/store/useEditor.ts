import { useMemo } from 'react'
import { create } from 'zustand'
import type { Background, TicketDocument, TicketElement } from '../types'
import { uid } from '../lib/id'
import { TEMPLATES } from '../templates'

export interface Project {
  tickets: TicketDocument[]
  activeId: string
}

interface HistoryEntry {
  project: Project
  key?: string
  time: number
}

export type SidebarTab = 'templates' | 'text' | 'elements' | 'uploads' | 'background' | 'tickets'

interface EditorState {
  project: Project
  past: HistoryEntry[]
  future: HistoryEntry[]
  selectedIds: string[]
  editingTextId: string | null
  zoom: number | 'fit'
  sidebarTab: SidebarTab
  clipboard: TicketElement[]

  // selectors
  activeDoc: () => TicketDocument
  selectedElements: () => TicketElement[]

  // ui
  select: (ids: string[]) => void
  toggleSelect: (id: string) => void
  clearSelection: () => void
  setEditingText: (id: string | null) => void
  setZoom: (z: number | 'fit') => void
  setSidebarTab: (t: SidebarTab) => void

  // document mutations (all recorded in history)
  updateElement: (id: string, patch: Partial<TicketElement>, coalesceKey?: string) => void
  updateElements: (patches: { id: string; patch: Partial<TicketElement> }[], coalesceKey?: string) => void
  addElement: (el: TicketElement, opts?: { select?: boolean }) => void
  removeElements: (ids: string[]) => void
  duplicateElements: (ids: string[]) => void
  reorder: (id: string, dir: 'front' | 'back' | 'forward' | 'backward') => void
  setBackground: (bg: Partial<Background>, coalesceKey?: string) => void
  setDocProps: (patch: Partial<Pick<TicketDocument, 'name' | 'width' | 'height' | 'cornerRadius'>>, coalesceKey?: string) => void
  copy: () => void
  paste: () => void

  // tickets in project
  addTicketFromTemplate: (templateId: string) => void
  duplicateTicket: (id: string) => void
  removeTicket: (id: string) => void
  setActiveTicket: (id: string) => void
  replaceProject: (project: Project) => void

  undo: () => void
  redo: () => void
}

const STORAGE_KEY = 'ticket-stub-creator:project:v1'
const COALESCE_MS = 900
const MAX_HISTORY = 100

function defaultProject(): Project {
  const first = TEMPLATES[0].build()
  return { tickets: [first], activeId: first.id }
}

function loadProject(): Project {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProject()
    const parsed = JSON.parse(raw) as Project
    if (!parsed?.tickets?.length) return defaultProject()
    if (!parsed.tickets.some((t) => t.id === parsed.activeId)) parsed.activeId = parsed.tickets[0].id
    return parsed
  } catch {
    return defaultProject()
  }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined
function persist(project: Project) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
    } catch {
      /* quota exceeded: silently skip autosave */
    }
  }, 400)
}

function getActive(project: Project): TicketDocument {
  return project.tickets.find((t) => t.id === project.activeId) ?? project.tickets[0]
}

function withActive(project: Project, fn: (doc: TicketDocument) => TicketDocument): Project {
  return {
    ...project,
    tickets: project.tickets.map((t) => (t.id === project.activeId ? fn(t) : t)),
  }
}

/** Deep-clone an element with a new id (offset optional). */
function cloneElement(el: TicketElement, offset = 0): TicketElement {
  return { ...JSON.parse(JSON.stringify(el)), id: uid(), x: el.x + offset, y: el.y + offset }
}

export const useEditor = create<EditorState>((set, get) => {
  /** Apply a project mutation and record the previous state in history. */
  const commit = (fn: (p: Project) => Project, coalesceKey?: string) => {
    const { project, past } = get()
    const now = Date.now()
    const last = past[past.length - 1]
    const coalesce = coalesceKey && last && last.key === coalesceKey && now - last.time < COALESCE_MS
    const next = fn(project)
    if (next === project) return
    const newPast = coalesce
      ? [...past.slice(0, -1), { ...last, time: now }]
      : [...past, { project, key: coalesceKey, time: now }].slice(-MAX_HISTORY)
    set({ project: next, past: newPast, future: [] })
    persist(next)
  }

  const initial = loadProject()

  return {
    project: initial,
    past: [],
    future: [],
    selectedIds: [],
    editingTextId: null,
    zoom: 'fit',
    sidebarTab: 'templates',
    clipboard: [],

    activeDoc: () => getActive(get().project),
    selectedElements: () => {
      const doc = getActive(get().project)
      const ids = new Set(get().selectedIds)
      return doc.elements.filter((e) => ids.has(e.id))
    },

    select: (ids) => set({ selectedIds: ids }),
    toggleSelect: (id) =>
      set((s) => ({
        selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id],
      })),
    clearSelection: () => set({ selectedIds: [], editingTextId: null }),
    setEditingText: (id) => set({ editingTextId: id }),
    setZoom: (zoom) => set({ zoom }),
    setSidebarTab: (sidebarTab) => set({ sidebarTab }),

    updateElement: (id, patch, coalesceKey) =>
      commit(
        (p) =>
          withActive(p, (d) => ({
            ...d,
            elements: d.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as TicketElement) : e)),
          })),
        coalesceKey,
      ),

    updateElements: (patches, coalesceKey) =>
      commit(
        (p) =>
          withActive(p, (d) => {
            const map = new Map(patches.map((x) => [x.id, x.patch]))
            return {
              ...d,
              elements: d.elements.map((e) => (map.has(e.id) ? ({ ...e, ...map.get(e.id) } as TicketElement) : e)),
            }
          }),
        coalesceKey,
      ),

    addElement: (el, opts) => {
      commit((p) => withActive(p, (d) => ({ ...d, elements: [...d.elements, el] })))
      if (opts?.select !== false) set({ selectedIds: [el.id] })
    },

    removeElements: (ids) => {
      const rm = new Set(ids)
      commit((p) => withActive(p, (d) => ({ ...d, elements: d.elements.filter((e) => !rm.has(e.id)) })))
      set((s) => ({ selectedIds: s.selectedIds.filter((x) => !rm.has(x)), editingTextId: null }))
    },

    duplicateElements: (ids) => {
      const want = new Set(ids)
      const clones: TicketElement[] = []
      commit((p) =>
        withActive(p, (d) => {
          for (const e of d.elements) if (want.has(e.id)) clones.push(cloneElement(e, 30))
          return { ...d, elements: [...d.elements, ...clones] }
        }),
      )
      if (clones.length) set({ selectedIds: clones.map((c) => c.id) })
    },

    reorder: (id, dir) =>
      commit((p) =>
        withActive(p, (d) => {
          const idx = d.elements.findIndex((e) => e.id === id)
          if (idx < 0) return d
          const els = [...d.elements]
          const [el] = els.splice(idx, 1)
          let to = idx
          if (dir === 'front') to = els.length
          else if (dir === 'back') to = 0
          else if (dir === 'forward') to = Math.min(els.length, idx + 1)
          else if (dir === 'backward') to = Math.max(0, idx - 1)
          els.splice(to, 0, el)
          return { ...d, elements: els }
        }),
      ),

    setBackground: (bg, coalesceKey) =>
      commit((p) => withActive(p, (d) => ({ ...d, background: { ...d.background, ...bg } })), coalesceKey),

    setDocProps: (patch, coalesceKey) => commit((p) => withActive(p, (d) => ({ ...d, ...patch })), coalesceKey),

    copy: () => {
      const els = get().selectedElements()
      if (els.length) set({ clipboard: els.map((e) => JSON.parse(JSON.stringify(e))) })
    },

    paste: () => {
      const { clipboard } = get()
      if (!clipboard.length) return
      const clones = clipboard.map((e) => cloneElement(e, 30))
      commit((p) => withActive(p, (d) => ({ ...d, elements: [...d.elements, ...clones] })))
      set({ selectedIds: clones.map((c) => c.id), clipboard: clones.map((c) => JSON.parse(JSON.stringify(c))) })
    },

    addTicketFromTemplate: (templateId) => {
      const t = TEMPLATES.find((x) => x.id === templateId)
      if (!t) return
      const docNew = t.build()
      commit((p) => ({ tickets: [...p.tickets, docNew], activeId: docNew.id }))
      set({ selectedIds: [], editingTextId: null, zoom: 'fit' })
    },

    duplicateTicket: (id) => {
      const src = get().project.tickets.find((t) => t.id === id)
      if (!src) return
      const copy: TicketDocument = { ...JSON.parse(JSON.stringify(src)), id: uid('doc'), name: `${src.name} copy` }
      copy.elements = copy.elements.map((e) => ({ ...e, id: uid() }))
      commit((p) => {
        const idx = p.tickets.findIndex((t) => t.id === id)
        const tickets = [...p.tickets]
        tickets.splice(idx + 1, 0, copy)
        return { tickets, activeId: copy.id }
      })
      set({ selectedIds: [], editingTextId: null })
    },

    removeTicket: (id) => {
      commit((p) => {
        if (p.tickets.length <= 1) return p
        const tickets = p.tickets.filter((t) => t.id !== id)
        const activeId = p.activeId === id ? tickets[Math.max(0, p.tickets.findIndex((t) => t.id === id) - 1)].id : p.activeId
        return { tickets, activeId }
      })
      set({ selectedIds: [], editingTextId: null })
    },

    setActiveTicket: (id) => {
      const { project } = get()
      if (project.activeId === id || !project.tickets.some((t) => t.id === id)) return
      const next = { ...project, activeId: id }
      set({ project: next, selectedIds: [], editingTextId: null, zoom: 'fit' })
      persist(next)
    },

    replaceProject: (project) => {
      commit(() => project)
      set({ selectedIds: [], editingTextId: null, zoom: 'fit' })
    },

    undo: () => {
      const { past, future, project } = get()
      if (!past.length) return
      const prev = past[past.length - 1]
      set({
        project: prev.project,
        past: past.slice(0, -1),
        future: [{ project, time: Date.now() }, ...future],
        selectedIds: [],
        editingTextId: null,
      })
      persist(prev.project)
    },

    redo: () => {
      const { past, future, project } = get()
      if (!future.length) return
      const next = future[0]
      set({
        project: next.project,
        past: [...past, { project, time: Date.now() }],
        future: future.slice(1),
        selectedIds: [],
        editingTextId: null,
      })
      persist(next.project)
    },
  }
})

/** Convenience hook: the active ticket document (re-renders on change). */
export const useActiveDoc = () => useEditor((s) => getActive(s.project))

/** Convenience hook: the currently selected elements (stable while nothing changes). */
export function useSelectedElements(): TicketElement[] {
  const doc = useActiveDoc()
  const selectedIds = useEditor((s) => s.selectedIds)
  return useMemo(() => {
    const ids = new Set(selectedIds)
    return doc.elements.filter((e) => ids.has(e.id))
  }, [doc.elements, selectedIds])
}
