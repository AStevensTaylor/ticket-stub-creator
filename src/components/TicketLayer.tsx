import { useMemo } from 'react'
import { Ellipse, Group, Image as KImage, Line, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import type {
  BarcodeElement,
  EllipseElement,
  ImageElement,
  LineElement,
  PerforationElement,
  RectElement,
  TextElement,
  TicketDocument,
  TicketElement,
} from '../types'
import { useImageEl } from '../lib/images'
import { barcodeBars } from '../lib/barcode'

/* ---------------------------------------------------------- background */

export function gradientPoints(width: number, height: number, angleDeg: number) {
  const a = ((angleDeg ?? 90) * Math.PI) / 180
  const vx = Math.sin(a)
  const vy = -Math.cos(a)
  const len = Math.abs(width * vx) + Math.abs(height * vy)
  const cx = width / 2
  const cy = height / 2
  return {
    start: { x: cx - (vx * len) / 2, y: cy - (vy * len) / 2 },
    end: { x: cx + (vx * len) / 2, y: cy + (vy * len) / 2 },
  }
}

export function BackgroundRect({ doc, onClick }: { doc: TicketDocument; onClick?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void }) {
  const { background: bg, width, height, cornerRadius } = doc
  if (bg.type === 'gradient') {
    const { start, end } = gradientPoints(width, height, bg.angle ?? 90)
    return (
      <Rect
        name="ticket-background"
        width={width}
        height={height}
        cornerRadius={cornerRadius}
        fillLinearGradientStartPoint={start}
        fillLinearGradientEndPoint={end}
        fillLinearGradientColorStops={[0, bg.color, 1, bg.color2 ?? bg.color]}
        onClick={onClick}
        onTap={onClick}
      />
    )
  }
  return <Rect name="ticket-background" width={width} height={height} cornerRadius={cornerRadius} fill={bg.color} onClick={onClick} onTap={onClick} />
}

/* ------------------------------------------------------------- shapes */

const HIT_FILL = 'rgba(0,0,0,0)'

function TextShape({ el }: { el: TextElement }) {
  return (
    <Text
      width={el.width}
      height={el.height}
      text={el.text}
      fontFamily={el.fontFamily}
      fontSize={el.fontSize}
      fontStyle={el.fontStyle}
      textDecoration={el.textDecoration || ''}
      fill={el.fill}
      align={el.align}
      verticalAlign={el.verticalAlign ?? 'top'}
      letterSpacing={el.letterSpacing}
      lineHeight={el.lineHeight}
      stroke={el.stroke || undefined}
      strokeWidth={el.stroke ? el.strokeWidth ?? 0 : 0}
      fillAfterStrokeEnabled
      wrap="word"
      perfectDrawEnabled={false}
    />
  )
}

function ImageShape({ el }: { el: ImageElement }) {
  const img = useImageEl(el.src)
  const layout = useMemo(() => {
    if (!img) return null
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    const fit = el.fit ?? 'cover'
    if (fit === 'stretch') return { crop: undefined, x: 0, y: 0, w: el.width, h: el.height }
    const ir = iw / ih
    const er = el.width / el.height
    if (fit === 'cover') {
      let cw = iw
      let ch = ih
      if (ir > er) cw = ih * er
      else ch = iw / er
      return { crop: { x: (iw - cw) / 2, y: (ih - ch) / 2, width: cw, height: ch }, x: 0, y: 0, w: el.width, h: el.height }
    }
    // contain
    let w = el.width
    let h = el.height
    if (ir > er) h = el.width / ir
    else w = el.height * ir
    return { crop: undefined, x: (el.width - w) / 2, y: (el.height - h) / 2, w, h }
  }, [img, el.width, el.height, el.fit])

  return (
    <>
      <Rect width={el.width} height={el.height} fill={HIT_FILL} />
      {img && layout ? (
        <KImage
          image={img}
          x={layout.x}
          y={layout.y}
          width={layout.w}
          height={layout.h}
          crop={layout.crop}
          cornerRadius={el.cornerRadius}
          stroke={el.stroke || undefined}
          strokeWidth={el.stroke ? el.strokeWidth ?? 0 : 0}
        />
      ) : (
        <Rect width={el.width} height={el.height} fill="#e5e7eb" cornerRadius={el.cornerRadius} />
      )}
    </>
  )
}

function RectShape({ el }: { el: RectElement }) {
  return (
    <Rect
      width={el.width}
      height={el.height}
      fill={el.fill || undefined}
      stroke={el.stroke || undefined}
      strokeWidth={el.stroke ? el.strokeWidth : 0}
      cornerRadius={el.cornerRadius}
      dash={el.dash}
    />
  )
}

function EllipseShape({ el }: { el: EllipseElement }) {
  return (
    <Ellipse
      x={el.width / 2}
      y={el.height / 2}
      radiusX={el.width / 2}
      radiusY={el.height / 2}
      fill={el.fill || undefined}
      stroke={el.stroke || undefined}
      strokeWidth={el.stroke ? el.strokeWidth : 0}
    />
  )
}

function LineShape({ el }: { el: LineElement }) {
  const hit = Math.max(el.strokeWidth, 24)
  return (
    <>
      <Rect y={-hit / 2} width={el.width} height={hit} fill={HIT_FILL} />
      <Line points={[0, 0, el.width, 0]} stroke={el.stroke} strokeWidth={el.strokeWidth} dash={el.dash} lineCap="round" />
    </>
  )
}

function BarcodeShape({ el }: { el: BarcodeElement }) {
  const textH = el.showText ? Math.min(el.height * 0.24, 60) : 0
  const barsH = el.height - textH
  const bars = useMemo(() => {
    const widths = barcodeBars(el.seed || el.id, 46)
    const units = widths.reduce((a, b) => a + b, 0) + widths.length - 1
    const unit = el.width / units
    let x = 0
    return widths.map((b) => {
      const bar = { x, w: b * unit }
      x += (b + 1) * unit
      return bar
    })
  }, [el.seed, el.id, el.width])
  return (
    <>
      <Rect width={el.width} height={el.height} fill={HIT_FILL} />
      {bars.map((b, i) => (
        <Rect key={i} x={b.x} width={b.w} height={barsH} fill={el.fill} />
      ))}
      {el.showText && (
        <Text
          y={barsH + textH * 0.15}
          width={el.width}
          height={textH}
          text={el.text}
          fontFamily="Courier New"
          fontStyle="bold"
          fontSize={textH * 0.72}
          fill={el.fill}
          align="center"
          letterSpacing={textH * 0.15}
        />
      )}
    </>
  )
}

function PerforationShape({ el }: { el: PerforationElement }) {
  const vertical = el.orientation === 'vertical'
  const hit = Math.max(el.dotSize, 24)
  return (
    <>
      {vertical ? (
        <Rect x={-hit / 2} width={hit} height={el.height} fill={HIT_FILL} />
      ) : (
        <Rect y={-hit / 2} width={el.width} height={hit} fill={HIT_FILL} />
      )}
      <Line
        points={vertical ? [0, 0, 0, el.height] : [0, 0, el.width, 0]}
        stroke={el.stroke}
        strokeWidth={el.dotSize}
        dash={[Math.max(0.1, el.dotSize * 0.01), el.gap]}
        lineCap="round"
      />
    </>
  )
}

export function ElementShape({ el }: { el: TicketElement }) {
  switch (el.type) {
    case 'text':
      return <TextShape el={el} />
    case 'image':
      return <ImageShape el={el} />
    case 'rect':
      return <RectShape el={el} />
    case 'ellipse':
      return <EllipseShape el={el} />
    case 'line':
      return <LineShape el={el} />
    case 'barcode':
      return <BarcodeShape el={el} />
    case 'perforation':
      return <PerforationShape el={el} />
  }
}

/* ------------------------------------------------------- static render */

/** Non-interactive rendering of a whole ticket; used for thumbnails and print/export stages. */
export function StaticTicket({ doc }: { doc: TicketDocument }) {
  return (
    <Group
      clipFunc={(ctx) => {
        roundedRectPath(ctx, doc.width, doc.height, doc.cornerRadius)
      }}
    >
      <BackgroundRect doc={doc} />
      {doc.elements.map((el) => (
        <Group key={el.id} x={el.x} y={el.y} rotation={el.rotation} opacity={el.opacity} listening={false}>
          <ElementShape el={el} />
        </Group>
      ))}
    </Group>
  )
}

export function roundedRectPath(ctx: Konva.Context, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(rr, 0)
  ctx.lineTo(w - rr, 0)
  ctx.arcTo(w, 0, w, rr, rr)
  ctx.lineTo(w, h - rr)
  ctx.arcTo(w, h, w - rr, h, rr)
  ctx.lineTo(rr, h)
  ctx.arcTo(0, h, 0, h - rr, rr)
  ctx.lineTo(0, rr)
  ctx.arcTo(0, 0, rr, 0, rr)
  ctx.closePath()
}
