import { useRef } from 'react'
import { useActiveDoc, useEditor, useSelectedElements } from '../store/useEditor'
import type { BarcodeElement, EllipseElement, ImageElement, LineElement, PerforationElement, RectElement, TextElement, TicketElement } from '../types'
import { FONTS } from '../lib/fonts'
import { fileToDataURL } from '../lib/images'
import { ColorInput, Field, NumberInput, Select, Slider } from './controls'

export default function PropertiesPanel() {
  const doc = useActiveDoc()
  const selected = useSelectedElements()
  const { updateElement, updateElements, removeElements, duplicateElements, reorder, clearSelection } = useEditor()

  if (!selected.length) {
    return (
      <aside className="props">
        <h3 className="panel-title">{doc.name}</h3>
        <p className="panel-help">
          Select something on the ticket to edit it. Double-click text to type. Hold <kbd>Shift</kbd> to select several.
        </p>
        <div className="shortcuts">
          <div><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>Ctrl</kbd>+<kbd>Y</kbd> redo</div>
          <div><kbd>Ctrl</kbd>+<kbd>D</kbd> duplicate · <kbd>Del</kbd> delete</div>
          <div><kbd>Ctrl</kbd>+<kbd>C</kbd>/<kbd>V</kbd> copy &amp; paste</div>
          <div><kbd>←↑→↓</kbd> nudge · <kbd>Shift</kbd> for bigger steps</div>
          <div><kbd>Ctrl</kbd>+<kbd>]</kbd>/<kbd>[</kbd> layer order</div>
          <div><kbd>Ctrl</kbd>+scroll to zoom</div>
        </div>
      </aside>
    )
  }

  const multi = selected.length > 1
  const el = selected[0]
  const ids = selected.map((s) => s.id)
  const patchAll = (patch: Partial<TicketElement>, key?: string) => updateElements(ids.map((id) => ({ id, patch })), key)

  const alignTo = (how: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => {
    updateElements(
      selected.map((s) => {
        const w = s.type === 'perforation' && s.orientation === 'vertical' ? 0 : s.width
        const h = s.type === 'line' || (s.type === 'perforation' && s.orientation === 'horizontal') ? 0 : s.height
        const patch: Partial<TicketElement> = {}
        if (how === 'left') patch.x = 0
        if (how === 'hcenter') patch.x = Math.round((doc.width - w) / 2)
        if (how === 'right') patch.x = doc.width - w
        if (how === 'top') patch.y = 0
        if (how === 'vcenter') patch.y = Math.round((doc.height - h) / 2)
        if (how === 'bottom') patch.y = doc.height - h
        return { id: s.id, patch }
      }),
    )
  }

  return (
    <aside className="props">
      <div className="props-header">
        <h3 className="panel-title">{multi ? `${selected.length} items` : titleFor(el)}</h3>
        <button className="btn ghost" onClick={clearSelection} title="Deselect (Esc)">×</button>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={() => duplicateElements(ids)} title="Duplicate (Ctrl+D)">Duplicate</button>
        <button className="btn danger" onClick={() => removeElements(ids)} title="Delete (Del)">Delete</button>
        <button className="btn" onClick={() => patchAll({ locked: !el.locked })} title="Lock or unlock position">
          {el.locked ? 'Unlock' : 'Lock'}
        </button>
      </div>

      <section className="props-section">
        <h4>Arrange</h4>
        <div className="btn-row">
          <button className="btn" onClick={() => ids.forEach((id) => reorder(id, 'forward'))} title="Bring forward (Ctrl+])">Forward</button>
          <button className="btn" onClick={() => ids.forEach((id) => reorder(id, 'backward'))} title="Send backward (Ctrl+[)">Backward</button>
          <button className="btn" onClick={() => ids.forEach((id) => reorder(id, 'front'))} title="Bring to front">Front</button>
          <button className="btn" onClick={() => ids.forEach((id) => reorder(id, 'back'))} title="Send to back">Back</button>
        </div>
        <div className="btn-row align-row">
          <button className="btn" onClick={() => alignTo('left')} title="Align left">⇤</button>
          <button className="btn" onClick={() => alignTo('hcenter')} title="Center horizontally">↔</button>
          <button className="btn" onClick={() => alignTo('right')} title="Align right">⇥</button>
          <button className="btn" onClick={() => alignTo('top')} title="Align top">⤒</button>
          <button className="btn" onClick={() => alignTo('vcenter')} title="Center vertically">↕</button>
          <button className="btn" onClick={() => alignTo('bottom')} title="Align bottom">⤓</button>
        </div>
        {!multi && (
          <>
            <div className="row">
              <Field label="X">
                <NumberInput value={el.x} onChange={(v) => updateElement(el.id, { x: v }, 'pos')} />
              </Field>
              <Field label="Y">
                <NumberInput value={el.y} onChange={(v) => updateElement(el.id, { y: v }, 'pos')} />
              </Field>
            </div>
            <div className="row">
              {!(el.type === 'perforation' && el.orientation === 'vertical') && (
                <Field label={el.type === 'line' || el.type === 'perforation' ? 'Length' : 'Width'}>
                  <NumberInput value={el.width} min={1} onChange={(v) => updateElement(el.id, { width: v }, 'size')} />
                </Field>
              )}
              {el.type !== 'line' && !(el.type === 'perforation' && el.orientation === 'horizontal') && (
                <Field label={el.type === 'perforation' ? 'Length' : 'Height'}>
                  <NumberInput value={el.height} min={1} onChange={(v) => updateElement(el.id, { height: v }, 'size')} />
                </Field>
              )}
            </div>
            <Field label="Rotation">
              <Slider value={el.rotation} min={-180} max={180} onChange={(v) => updateElement(el.id, { rotation: v }, 'rot')} />
            </Field>
          </>
        )}
        <Field label="Opacity">
          <Slider value={el.opacity} min={0} max={1} step={0.01} onChange={(v) => patchAll({ opacity: v }, 'opacity')} />
        </Field>
      </section>

      {!multi && el.type === 'text' && <TextProps el={el} />}
      {!multi && el.type === 'image' && <ImageProps el={el} />}
      {!multi && el.type === 'rect' && <RectProps el={el} />}
      {!multi && el.type === 'ellipse' && <EllipseProps el={el} />}
      {!multi && el.type === 'line' && <LineProps el={el} />}
      {!multi && el.type === 'barcode' && <BarcodeProps el={el} />}
      {!multi && el.type === 'perforation' && <PerforationProps el={el} />}
      {multi && <MultiProps els={selected} />}
    </aside>
  )
}

function titleFor(el: TicketElement) {
  return { text: 'Text', image: 'Image', rect: 'Rectangle', ellipse: 'Ellipse', line: 'Line', barcode: 'Barcode', perforation: 'Perforation' }[el.type]
}

function TextProps({ el }: { el: TextElement }) {
  const updateElement = useEditor((s) => s.updateElement)
  const up = (patch: Partial<TextElement>, key?: string) => updateElement(el.id, patch, key)
  const bold = el.fontStyle.includes('bold')
  const italic = el.fontStyle.includes('italic')
  const setStyle = (b: boolean, i: boolean) => up({ fontStyle: (b && i ? 'bold italic' : b ? 'bold' : i ? 'italic' : 'normal') as TextElement['fontStyle'] })
  return (
    <section className="props-section">
      <h4>Text</h4>
      <textarea className="text-content" rows={3} value={el.text} onChange={(e) => up({ text: e.target.value }, 'text')} />
      <Field label="Font">
        <Select value={el.fontFamily} onChange={(v) => up({ fontFamily: v })} options={FONTS.map((f) => ({ value: f.family, label: f.label }))} />
      </Field>
      <div className="row">
        <Field label="Size">
          <NumberInput value={el.fontSize} min={4} max={600} onChange={(v) => up({ fontSize: v }, 'font-size')} />
        </Field>
        <Field label="Colour">
          <ColorInput value={el.fill} onChange={(c) => up({ fill: c }, 'text-fill')} />
        </Field>
      </div>
      <div className="btn-row toggles">
        <button className={`btn ${bold ? 'active' : ''}`} onClick={() => setStyle(!bold, italic)} title="Bold"><b>B</b></button>
        <button className={`btn ${italic ? 'active' : ''}`} onClick={() => setStyle(bold, !italic)} title="Italic"><i>I</i></button>
        <button className={`btn ${el.textDecoration === 'underline' ? 'active' : ''}`} onClick={() => up({ textDecoration: el.textDecoration === 'underline' ? '' : 'underline' })} title="Underline"><u>U</u></button>
        <button className={`btn ${el.align === 'left' ? 'active' : ''}`} onClick={() => up({ align: 'left' })} title="Align left">≡</button>
        <button className={`btn ${el.align === 'center' ? 'active' : ''}`} onClick={() => up({ align: 'center' })} title="Align centre">☰</button>
        <button className={`btn ${el.align === 'right' ? 'active' : ''}`} onClick={() => up({ align: 'right' })} title="Align right">≡</button>
      </div>
      <Field label="Vertical align">
        <Select value={el.verticalAlign ?? 'top'} onChange={(v) => up({ verticalAlign: v })} options={[{ value: 'top', label: 'Top' }, { value: 'middle', label: 'Middle' }, { value: 'bottom', label: 'Bottom' }]} />
      </Field>
      <div className="row">
        <Field label="Letter spacing">
          <NumberInput value={el.letterSpacing} min={-20} max={100} onChange={(v) => up({ letterSpacing: v }, 'ls')} />
        </Field>
        <Field label="Line height">
          <NumberInput value={el.lineHeight} min={0.5} max={3} step={0.05} onChange={(v) => up({ lineHeight: v }, 'lh')} />
        </Field>
      </div>
      <div className="row">
        <Field label="Outline">
          <ColorInput value={el.stroke ?? ''} allowNone onChange={(c) => up({ stroke: c, strokeWidth: el.strokeWidth || 2 }, 'text-stroke')} />
        </Field>
        <Field label="Outline width">
          <NumberInput value={el.strokeWidth ?? 0} min={0} max={40} onChange={(v) => up({ strokeWidth: v }, 'text-stroke-w')} />
        </Field>
      </div>
    </section>
  )
}

function ImageProps({ el }: { el: ImageElement }) {
  const updateElement = useEditor((s) => s.updateElement)
  const up = (patch: Partial<ImageElement>, key?: string) => updateElement(el.id, patch, key)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <section className="props-section">
      <h4>Image</h4>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) up({ src: await fileToDataURL(f) })
          e.target.value = ''
        }}
      />
      <button className="btn primary block" onClick={() => inputRef.current?.click()}>Replace image…</button>
      <Field label="Fit">
        <Select value={el.fit ?? 'cover'} onChange={(v) => up({ fit: v })} options={[{ value: 'cover', label: 'Fill (crop)' }, { value: 'contain', label: 'Fit inside' }, { value: 'stretch', label: 'Stretch' }]} />
      </Field>
      <Field label="Corner radius">
        <Slider value={el.cornerRadius} min={0} max={Math.round(Math.min(el.width, el.height) / 2)} onChange={(v) => up({ cornerRadius: v }, 'img-radius')} />
      </Field>
      <div className="row">
        <Field label="Border">
          <ColorInput value={el.stroke ?? ''} allowNone onChange={(c) => up({ stroke: c, strokeWidth: el.strokeWidth || 8 }, 'img-stroke')} />
        </Field>
        <Field label="Border width">
          <NumberInput value={el.strokeWidth ?? 0} min={0} max={100} onChange={(v) => up({ strokeWidth: v }, 'img-stroke-w')} />
        </Field>
      </div>
    </section>
  )
}

function RectProps({ el }: { el: RectElement }) {
  const updateElement = useEditor((s) => s.updateElement)
  const up = (patch: Partial<RectElement>, key?: string) => updateElement(el.id, patch, key)
  return (
    <section className="props-section">
      <h4>Rectangle</h4>
      <Field label="Fill">
        <ColorInput value={el.fill} allowNone onChange={(c) => up({ fill: c }, 'fill')} />
      </Field>
      <div className="row">
        <Field label="Border">
          <ColorInput value={el.stroke} allowNone onChange={(c) => up({ stroke: c, strokeWidth: el.strokeWidth || 4 }, 'stroke')} />
        </Field>
        <Field label="Border width">
          <NumberInput value={el.strokeWidth} min={0} max={100} onChange={(v) => up({ strokeWidth: v }, 'stroke-w')} />
        </Field>
      </div>
      <Field label="Corner radius">
        <Slider value={el.cornerRadius} min={0} max={Math.round(Math.min(el.width, el.height) / 2)} onChange={(v) => up({ cornerRadius: v }, 'radius')} />
      </Field>
      <Field label="Dashed border" inline>
        <input type="checkbox" checked={!!el.dash?.length} onChange={(e) => up({ dash: e.target.checked ? [20, 14] : undefined })} />
      </Field>
    </section>
  )
}

function EllipseProps({ el }: { el: EllipseElement }) {
  const updateElement = useEditor((s) => s.updateElement)
  const up = (patch: Partial<EllipseElement>, key?: string) => updateElement(el.id, patch, key)
  return (
    <section className="props-section">
      <h4>Ellipse</h4>
      <Field label="Fill">
        <ColorInput value={el.fill} allowNone onChange={(c) => up({ fill: c }, 'fill')} />
      </Field>
      <div className="row">
        <Field label="Border">
          <ColorInput value={el.stroke} allowNone onChange={(c) => up({ stroke: c, strokeWidth: el.strokeWidth || 4 }, 'stroke')} />
        </Field>
        <Field label="Border width">
          <NumberInput value={el.strokeWidth} min={0} max={100} onChange={(v) => up({ strokeWidth: v }, 'stroke-w')} />
        </Field>
      </div>
    </section>
  )
}

function LineProps({ el }: { el: LineElement }) {
  const updateElement = useEditor((s) => s.updateElement)
  const up = (patch: Partial<LineElement>, key?: string) => updateElement(el.id, patch, key)
  return (
    <section className="props-section">
      <h4>Line</h4>
      <div className="row">
        <Field label="Colour">
          <ColorInput value={el.stroke} onChange={(c) => up({ stroke: c }, 'stroke')} />
        </Field>
        <Field label="Thickness">
          <NumberInput value={el.strokeWidth} min={1} max={100} onChange={(v) => up({ strokeWidth: v }, 'stroke-w')} />
        </Field>
      </div>
      <Field label="Dashed" inline>
        <input type="checkbox" checked={!!el.dash?.length} onChange={(e) => up({ dash: e.target.checked ? [20, 14] : undefined })} />
      </Field>
    </section>
  )
}

function BarcodeProps({ el }: { el: BarcodeElement }) {
  const updateElement = useEditor((s) => s.updateElement)
  const up = (patch: Partial<BarcodeElement>, key?: string) => updateElement(el.id, patch, key)
  return (
    <section className="props-section">
      <h4>Barcode (decorative)</h4>
      <Field label="Colour">
        <ColorInput value={el.fill} onChange={(c) => up({ fill: c }, 'fill')} />
      </Field>
      <Field label="Show number" inline>
        <input type="checkbox" checked={el.showText} onChange={(e) => up({ showText: e.target.checked })} />
      </Field>
      <Field label="Number">
        <input type="text" value={el.text} onChange={(e) => up({ text: e.target.value }, 'bc-text')} />
      </Field>
      <button className="btn block" onClick={() => up({ seed: Math.random().toString(36).slice(2) })}>Shuffle bars</button>
    </section>
  )
}

function PerforationProps({ el }: { el: PerforationElement }) {
  const updateElement = useEditor((s) => s.updateElement)
  const up = (patch: Partial<PerforationElement>, key?: string) => updateElement(el.id, patch, key)
  return (
    <section className="props-section">
      <h4>Perforation</h4>
      <Field label="Colour">
        <ColorInput value={el.stroke} onChange={(c) => up({ stroke: c }, 'stroke')} />
      </Field>
      <Field label="Direction">
        <Select
          value={el.orientation}
          onChange={(v) => {
            const len = el.orientation === 'vertical' ? el.height : el.width
            up(v === 'vertical' ? { orientation: v, height: len, width: 0 } : { orientation: v, width: len, height: 0 })
          }}
          options={[{ value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' }]}
        />
      </Field>
      <div className="row">
        <Field label="Dot size">
          <NumberInput value={el.dotSize} min={1} max={40} onChange={(v) => up({ dotSize: v }, 'dot')} />
        </Field>
        <Field label="Gap">
          <NumberInput value={el.gap} min={1} max={100} onChange={(v) => up({ gap: v }, 'gap')} />
        </Field>
      </div>
    </section>
  )
}

function MultiProps({ els }: { els: TicketElement[] }) {
  const updateElements = useEditor((s) => s.updateElements)
  const colourable = els.filter((e) => e.type === 'text' || e.type === 'rect' || e.type === 'ellipse' || e.type === 'barcode')
  const strokeable = els.filter((e) => e.type === 'line' || e.type === 'perforation')
  const texts = els.filter((e): e is TextElement => e.type === 'text')
  return (
    <section className="props-section">
      <h4>Bulk edit</h4>
      {colourable.length > 0 && (
        <Field label="Fill colour">
          <ColorInput value={(colourable[0] as RectElement).fill} onChange={(c) => updateElements(colourable.map((e) => ({ id: e.id, patch: { fill: c } })), 'multi-fill')} />
        </Field>
      )}
      {strokeable.length > 0 && (
        <Field label="Line colour">
          <ColorInput value={(strokeable[0] as LineElement).stroke} onChange={(c) => updateElements(strokeable.map((e) => ({ id: e.id, patch: { stroke: c } })), 'multi-stroke')} />
        </Field>
      )}
      {texts.length > 0 && (
        <Field label="Font">
          <Select value={texts[0].fontFamily} onChange={(v) => updateElements(texts.map((e) => ({ id: e.id, patch: { fontFamily: v } })))} options={FONTS.map((f) => ({ value: f.family, label: f.label }))} />
        </Field>
      )}
    </section>
  )
}
