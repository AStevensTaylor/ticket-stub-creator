import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Group, Layer, Line, Rect, Stage, Transformer } from 'react-konva'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { useActiveDoc, useEditor } from '../store/useEditor'
import type { TextElement, TicketElement } from '../types'
import { BackgroundRect, ElementShape, roundedRectPath } from './TicketLayer'

const PADDING = 60
const SNAP_PX = 8

interface Guide {
  orientation: 'v' | 'h'
  pos: number
}

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(el)
    setSize({ width: el.clientWidth, height: el.clientHeight })
    return () => ro.disconnect()
  }, [ref])
  return size
}

function isEditableTarget(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable
}

export default function CanvasEditor() {
  const doc = useActiveDoc()
  const selectedIds = useEditor((s) => s.selectedIds)
  const editingTextId = useEditor((s) => s.editingTextId)
  const zoom = useEditor((s) => s.zoom)
  const {
    select,
    toggleSelect,
    clearSelection,
    setEditingText,
    updateElement,
    updateElements,
    removeElements,
    duplicateElements,
    reorder,
    undo,
    redo,
    copy,
    paste,
    setZoom,
  } = useEditor()

  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const nodeRefs = useRef(new Map<string, Konva.Group>())
  const dragStart = useRef<Map<string, { x: number; y: number }>>(new Map())
  const [guides, setGuides] = useState<Guide[]>([])
  const [hoverId, setHoverId] = useState<string | null>(null)
  const editValueRef = useRef<string | null>(null)

  const { width: cw, height: ch } = useContainerSize(containerRef)

  const fitScale = useMemo(() => {
    if (!cw || !ch) return 0.25
    return Math.max(0.02, Math.min((cw - PADDING * 2) / doc.width, (ch - PADDING * 2) / doc.height))
  }, [cw, ch, doc.width, doc.height])
  const scale = zoom === 'fit' ? fitScale : zoom

  const stageW = Math.max(cw, doc.width * scale + PADDING * 2)
  const stageH = Math.max(ch, doc.height * scale + PADDING * 2)
  const offsetX = (stageW - doc.width * scale) / 2
  const offsetY = (stageH - doc.height * scale) / 2

  const elementsById = useMemo(() => new Map(doc.elements.map((e) => [e.id, e])), [doc.elements])
  const selected = useMemo(() => selectedIds.map((id) => elementsById.get(id)).filter(Boolean) as TicketElement[], [selectedIds, elementsById])

  /* ------------------------------------------------ transformer binding */
  useEffect(() => {
    const tr = trRef.current
    if (!tr) return
    const nodes = selectedIds
      .filter((id) => id !== editingTextId)
      .map((id) => nodeRefs.current.get(id))
      .filter((n): n is Konva.Group => !!n && !elementsById.get(n.id())?.locked)
    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selectedIds, editingTextId, doc.elements, elementsById])

  const anchors = useMemo(() => {
    if (selected.length !== 1) return undefined
    const el = selected[0]
    if (el.type === 'line') return ['middle-left', 'middle-right']
    if (el.type === 'perforation') return el.orientation === 'vertical' ? ['top-center', 'bottom-center'] : ['middle-left', 'middle-right']
    return undefined
  }, [selected])
  const keepRatio = selected.length === 1 ? selected[0].type !== 'barcode' && selected[0].type !== 'rect' && selected[0].type !== 'ellipse' : true

  /* ------------------------------------------------ keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (mod && key === 'a') {
        e.preventDefault()
        select(doc.elements.filter((el) => !el.locked).map((el) => el.id))
        return
      }
      if (mod && key === 'c') {
        copy()
        return
      }
      if (mod && key === 'v') {
        paste()
        return
      }
      if (mod && key === 'd') {
        e.preventDefault()
        if (selectedIds.length) duplicateElements(selectedIds)
        return
      }
      if (mod && (key === '=' || key === '+')) {
        e.preventDefault()
        setZoom(Math.min(4, scale * 1.2))
        return
      }
      if (mod && key === '-') {
        e.preventDefault()
        setZoom(Math.max(0.05, scale / 1.2))
        return
      }
      if (mod && key === '0') {
        e.preventDefault()
        setZoom('fit')
        return
      }
      if (!selectedIds.length) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        removeElements(selectedIds)
        return
      }
      if (e.key === 'Escape') {
        clearSelection()
        return
      }
      if (mod && (e.key === ']' || e.key === '[')) {
        e.preventDefault()
        for (const id of selectedIds) reorder(id, e.key === ']' ? (e.shiftKey ? 'front' : 'forward') : e.shiftKey ? 'back' : 'backward')
        return
      }
      const step = e.shiftKey ? 20 : 2
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }
      if (nudge[e.key]) {
        e.preventDefault()
        const [dx, dy] = nudge[e.key]
        updateElements(
          selected.filter((el) => !el.locked).map((el) => ({ id: el.id, patch: { x: el.x + dx, y: el.y + dy } })),
          'nudge',
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedIds, selected, doc.elements, scale, undo, redo, select, copy, paste, duplicateElements, removeElements, clearSelection, reorder, updateElements, setZoom])

  /* ------------------------------------------------ wheel zoom */
  const onWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      if (!(e.evt.ctrlKey || e.evt.metaKey)) return
      e.evt.preventDefault()
      const dir = e.evt.deltaY > 0 ? 1 / 1.1 : 1.1
      setZoom(Math.min(4, Math.max(0.05, scale * dir)))
    },
    [scale, setZoom],
  )

  /* ------------------------------------------------ selection */
  const onElementClick = (el: TicketElement, e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true
    if (editingTextId && editingTextId !== el.id) finishEditing()
    const shift = 'shiftKey' in e.evt && (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)
    if (shift) toggleSelect(el.id)
    else if (!selectedIds.includes(el.id)) select([el.id])
  }

  const onStageMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const target = e.target
    if (target === stageRef.current || target.name() === 'ticket-background') {
      if (editingTextId) finishEditing()
      clearSelection()
    }
  }

  /* ------------------------------------------------ dragging + snapping */
  const onDragStart = (el: TicketElement) => {
    dragStart.current = new Map()
    const ids = selectedIds.includes(el.id) ? selectedIds : [el.id]
    if (!selectedIds.includes(el.id)) select([el.id])
    for (const id of ids) {
      const n = nodeRefs.current.get(id)
      if (n) dragStart.current.set(id, { x: n.x(), y: n.y() })
    }
  }

  const onDragMove = (el: TicketElement, e: KonvaEventObject<DragEvent>) => {
    const node = e.target as Konva.Group
    const start = dragStart.current.get(el.id)
    const layer = layerRef.current
    if (!start || !layer) return

    // Snapping (only for single-element drags).
    const newGuides: Guide[] = []
    if (dragStart.current.size === 1) {
      const box = node.getClientRect({ relativeTo: layer })
      const th = SNAP_PX / scale
      const vLines = [0, doc.width / 2, doc.width]
      const hLines = [0, doc.height / 2, doc.height]
      for (const other of doc.elements) {
        if (other.id === el.id) continue
        const n = nodeRefs.current.get(other.id)
        if (!n) continue
        const r = n.getClientRect({ relativeTo: layer })
        vLines.push(r.x, r.x + r.width / 2, r.x + r.width)
        hLines.push(r.y, r.y + r.height / 2, r.y + r.height)
      }
      const xs = [box.x, box.x + box.width / 2, box.x + box.width]
      const ys = [box.y, box.y + box.height / 2, box.y + box.height]
      let bestX: { d: number; line: number } | null = null
      let bestY: { d: number; line: number } | null = null
      for (const line of vLines) for (const x of xs) {
        const d = line - x
        if (Math.abs(d) < th && (!bestX || Math.abs(d) < Math.abs(bestX.d))) bestX = { d, line }
      }
      for (const line of hLines) for (const y of ys) {
        const d = line - y
        if (Math.abs(d) < th && (!bestY || Math.abs(d) < Math.abs(bestY.d))) bestY = { d, line }
      }
      if (bestX) {
        node.x(node.x() + bestX.d)
        newGuides.push({ orientation: 'v', pos: bestX.line })
      }
      if (bestY) {
        node.y(node.y() + bestY.d)
        newGuides.push({ orientation: 'h', pos: bestY.line })
      }
    }
    setGuides(newGuides)

    // Move the rest of the selection by the same delta.
    const dx = node.x() - start.x
    const dy = node.y() - start.y
    for (const [id, s] of dragStart.current) {
      if (id === el.id) continue
      const n = nodeRefs.current.get(id)
      if (n) n.position({ x: s.x + dx, y: s.y + dy })
    }
  }

  const onDragEnd = () => {
    setGuides([])
    const patches: { id: string; patch: Partial<TicketElement> }[] = []
    for (const id of dragStart.current.keys()) {
      const n = nodeRefs.current.get(id)
      if (n) patches.push({ id, patch: { x: Math.round(n.x()), y: Math.round(n.y()) } })
    }
    dragStart.current = new Map()
    if (patches.length) updateElements(patches)
  }

  /* ------------------------------------------------ transform end */
  const onTransformEnd = () => {
    const tr = trRef.current
    if (!tr) return
    const patches: { id: string; patch: Partial<TicketElement> }[] = []
    for (const node of tr.nodes()) {
      const el = elementsById.get(node.id())
      if (!el) continue
      const sx = node.scaleX()
      const sy = node.scaleY()
      node.scale({ x: 1, y: 1 })
      const patch: Partial<TicketElement> = {
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        rotation: Math.round(node.rotation() * 100) / 100,
      }
      if (el.type === 'line') {
        patch.width = Math.max(10, Math.round(el.width * sx))
      } else if (el.type === 'perforation') {
        if (el.orientation === 'vertical') patch.height = Math.max(10, Math.round(el.height * sy))
        else patch.width = Math.max(10, Math.round(el.width * sx))
      } else {
        patch.width = Math.max(4, Math.round(el.width * sx))
        patch.height = Math.max(4, Math.round(el.height * sy))
        if (el.type === 'text' && Math.abs(sy - 1) > 0.001) {
          ;(patch as Partial<TextElement>).fontSize = Math.max(4, Math.round(el.fontSize * sy * 10) / 10)
        }
      }
      patches.push({ id: el.id, patch })
    }
    if (patches.length) updateElements(patches)
  }

  /* ------------------------------------------------ inline text editing */
  const editingEl = editingTextId ? (elementsById.get(editingTextId) as TextElement | undefined) : undefined
  const editingNode = editingTextId ? nodeRefs.current.get(editingTextId) : undefined
  const editorStyle = useMemo<React.CSSProperties | null>(() => {
    if (!editingEl || !editingNode || editingEl.type !== 'text') return null
    const abs = editingNode.getAbsolutePosition()
    return {
      position: 'absolute',
      left: abs.x,
      top: abs.y,
      width: editingEl.width * scale,
      height: editingEl.height * scale,
      transform: `rotate(${editingEl.rotation}deg)`,
      transformOrigin: 'top left',
      fontFamily: `"${editingEl.fontFamily}"`,
      fontSize: editingEl.fontSize * scale,
      fontWeight: editingEl.fontStyle.includes('bold') ? 700 : 400,
      fontStyle: editingEl.fontStyle.includes('italic') ? 'italic' : 'normal',
      textDecoration: editingEl.textDecoration || 'none',
      color: editingEl.fill,
      textAlign: editingEl.align,
      letterSpacing: editingEl.letterSpacing * scale,
      lineHeight: editingEl.lineHeight,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingEl, editingNode, scale, offsetX, offsetY])

  /** Commit the inline editor's current value (if any) and leave edit mode. */
  const finishEditing = () => {
    const value = editValueRef.current
    editValueRef.current = null
    if (editingEl && value !== null && value !== editingEl.text) updateElement(editingEl.id, { text: value })
    if (editingTextId) setEditingText(null)
  }

  const zoomPct = Math.round(scale * 100)

  return (
    <div className="canvas-area">
      <div className="canvas-scroll" ref={containerRef}>
        <div className="canvas-inner" style={{ width: stageW, height: stageH }}>
          <Stage
            ref={stageRef}
            width={stageW}
            height={stageH}
            onMouseDown={onStageMouseDown}
            onTouchStart={onStageMouseDown}
            onWheel={onWheel}
          >
            <Layer ref={layerRef} x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
              <Rect
                x={0}
                y={0}
                width={doc.width}
                height={doc.height}
                cornerRadius={doc.cornerRadius}
                shadowColor="rgba(0,0,0,0.45)"
                shadowBlur={40 / scale}
                shadowOffsetY={12 / scale}
                fill="#000"
                listening={false}
              />
              <Group clipFunc={(ctx) => roundedRectPath(ctx, doc.width, doc.height, doc.cornerRadius)}>
                <BackgroundRect doc={doc} />
                {doc.elements.map((el) => (
                  <Group
                    key={el.id}
                    id={el.id}
                    ref={(n) => {
                      if (n) nodeRefs.current.set(el.id, n)
                      else nodeRefs.current.delete(el.id)
                    }}
                    x={el.x}
                    y={el.y}
                    rotation={el.rotation}
                    opacity={el.opacity}
                    visible={editingTextId !== el.id}
                    draggable={!el.locked}
                    onClick={(e) => onElementClick(el, e)}
                    onTap={(e) => onElementClick(el, e)}
                    onMouseDown={(e) => {
                      e.cancelBubble = true
                    }}
                    onTouchStart={(e) => {
                      e.cancelBubble = true
                    }}
                    onDblClick={() => {
                      if (el.type === 'text' && !el.locked) {
                        select([el.id])
                        setEditingText(el.id)
                      }
                    }}
                    onDblTap={() => {
                      if (el.type === 'text' && !el.locked) {
                        select([el.id])
                        setEditingText(el.id)
                      }
                    }}
                    onMouseEnter={(e) => {
                      setHoverId(el.id)
                      const c = e.target.getStage()?.container()
                      if (c) c.style.cursor = el.locked ? 'default' : 'move'
                    }}
                    onMouseLeave={(e) => {
                      setHoverId((h) => (h === el.id ? null : h))
                      const c = e.target.getStage()?.container()
                      if (c) c.style.cursor = 'default'
                    }}
                    onDragStart={() => onDragStart(el)}
                    onDragMove={(e) => onDragMove(el, e)}
                    onDragEnd={onDragEnd}
                    onTransformEnd={onTransformEnd}
                  >
                    <ElementShape el={el} />
                  </Group>
                ))}
              </Group>
            </Layer>

            <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale} listening={false}>
              {hoverId && !selectedIds.includes(hoverId) && elementsById.get(hoverId) && (
                <HoverOutline el={elementsById.get(hoverId)!} scale={scale} />
              )}
              {guides.map((g, i) =>
                g.orientation === 'v' ? (
                  <Line key={i} points={[g.pos, -PADDING / scale, g.pos, doc.height + PADDING / scale]} stroke="#ff2d95" strokeWidth={1 / scale} dash={[6 / scale, 4 / scale]} />
                ) : (
                  <Line key={i} points={[-PADDING / scale, g.pos, doc.width + PADDING / scale, g.pos]} stroke="#ff2d95" strokeWidth={1 / scale} dash={[6 / scale, 4 / scale]} />
                ),
              )}
            </Layer>

            <Layer>
              <Transformer
                ref={trRef}
                rotateEnabled
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                rotationSnapTolerance={5}
                enabledAnchors={anchors}
                keepRatio={keepRatio}
                anchorSize={10}
                anchorCornerRadius={5}
                anchorStroke="#7c3aed"
                anchorFill="#ffffff"
                borderStroke="#7c3aed"
                borderStrokeWidth={1.5}
                anchorStrokeWidth={1.5}
                ignoreStroke
                flipEnabled={false}
                boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 4 || Math.abs(newBox.height) < 1 ? oldBox : newBox)}
              />
            </Layer>
          </Stage>

          {editingEl && editorStyle && (
            <InlineTextEditor key={editingEl.id} initial={editingEl.text} style={editorStyle} valueRef={editValueRef} onCommit={finishEditing} />
          )}
        </div>
      </div>

      <div className="zoom-bar">
        <button className="btn ghost" onClick={() => setZoom(Math.max(0.05, scale / 1.2))} title="Zoom out (Ctrl+-)">−</button>
        <button className="btn ghost zoom-pct" onClick={() => setZoom('fit')} title="Fit to screen (Ctrl+0)">
          {zoomPct}%
        </button>
        <button className="btn ghost" onClick={() => setZoom(Math.min(4, scale * 1.2))} title="Zoom in (Ctrl++)">+</button>
        <span className="zoom-info">
          {(doc.width / 300).toFixed(2)} × {(doc.height / 300).toFixed(2)} in · 300 DPI
        </span>
      </div>
    </div>
  )
}

function HoverOutline({ el, scale }: { el: TicketElement; scale: number }) {
  const h = el.type === 'line' || (el.type === 'perforation' && el.orientation === 'horizontal') ? 0 : el.height
  const w = el.type === 'perforation' && el.orientation === 'vertical' ? 0 : el.width
  return <Rect x={el.x} y={el.y} width={w} height={h} rotation={el.rotation} stroke="#a78bfa" strokeWidth={1.5 / scale} listening={false} />
}

function InlineTextEditor({
  initial,
  style,
  valueRef,
  onCommit,
}: {
  initial: string
  style: React.CSSProperties
  valueRef: React.MutableRefObject<string | null>
  onCommit: () => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState(initial)
  useEffect(() => {
    valueRef.current = initial
    const ta = ref.current
    if (ta) {
      ta.focus()
      ta.select()
    }
  }, [initial, valueRef])
  return (
    <textarea
      ref={ref}
      className="inline-text-editor"
      style={style}
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        valueRef.current = e.target.value
      }}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
          e.preventDefault()
          onCommit()
        }
        e.stopPropagation()
      }}
    />
  )
}
