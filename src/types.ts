export type ElementType = 'text' | 'image' | 'rect' | 'ellipse' | 'line' | 'barcode' | 'perforation'

export interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked?: boolean
  name?: string
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic'
  textDecoration?: 'underline' | ''
  fill: string
  align: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  letterSpacing: number
  lineHeight: number
  stroke?: string
  strokeWidth?: number
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  cornerRadius: number
  stroke?: string
  strokeWidth?: number
  fit?: 'cover' | 'contain' | 'stretch'
  grayscale?: boolean
}

export interface RectElement extends BaseElement {
  type: 'rect'
  fill: string
  stroke: string
  strokeWidth: number
  cornerRadius: number
  dash?: number[]
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse'
  fill: string
  stroke: string
  strokeWidth: number
}

export interface LineElement extends BaseElement {
  type: 'line'
  stroke: string
  strokeWidth: number
  dash?: number[]
}

export interface BarcodeElement extends BaseElement {
  type: 'barcode'
  fill: string
  seed: string
  showText: boolean
  text: string
}

export interface PerforationElement extends BaseElement {
  type: 'perforation'
  stroke: string
  orientation: 'vertical' | 'horizontal'
  dotSize: number
  gap: number
}

export type TicketElement =
  | TextElement
  | ImageElement
  | RectElement
  | EllipseElement
  | LineElement
  | BarcodeElement
  | PerforationElement

export interface Background {
  type: 'solid' | 'gradient'
  color: string
  color2?: string
  angle?: number
}

/** All sizes are in canvas pixels at 300 DPI, i.e. 1 inch = 300 px. */
export interface TicketDocument {
  id: string
  name: string
  width: number
  height: number
  background: Background
  cornerRadius: number
  elements: TicketElement[]
  templateId?: string
}

export const DPI = 300
export const inch = (n: number) => Math.round(n * DPI)
export const mm = (n: number) => Math.round((n / 25.4) * DPI)
