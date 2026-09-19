import type {
  BarcodeElement,
  EllipseElement,
  ImageElement,
  LineElement,
  PerforationElement,
  RectElement,
  TextElement,
} from '../types'
import { uid } from '../lib/id'

type Box = { x: number; y: number; width: number; height: number }

const base = (b: Box) => ({ ...b, id: uid(), rotation: 0, opacity: 1 })

export function text(b: Box, props: Partial<Omit<TextElement, 'type' | keyof Box>> & { text: string }): TextElement {
  return {
    ...base(b),
    type: 'text',
    fontFamily: 'Oswald',
    fontSize: 40,
    fontStyle: 'normal',
    fill: '#111111',
    align: 'left',
    verticalAlign: 'top',
    letterSpacing: 0,
    lineHeight: 1.15,
    ...props,
  }
}

export function rect(b: Box, props: Partial<Omit<RectElement, 'type' | keyof Box>> = {}): RectElement {
  return { ...base(b), type: 'rect', fill: '#000000', stroke: '', strokeWidth: 0, cornerRadius: 0, ...props }
}

export function ellipse(b: Box, props: Partial<Omit<EllipseElement, 'type' | keyof Box>> = {}): EllipseElement {
  return { ...base(b), type: 'ellipse', fill: '#000000', stroke: '', strokeWidth: 0, ...props }
}

export function line(b: Box, props: Partial<Omit<LineElement, 'type' | keyof Box>> = {}): LineElement {
  return { ...base(b), type: 'line', stroke: '#000000', strokeWidth: 4, ...props }
}

export function image(b: Box, src: string, props: Partial<Omit<ImageElement, 'type' | 'src' | keyof Box>> = {}): ImageElement {
  return { ...base(b), type: 'image', src, cornerRadius: 0, fit: 'cover', ...props }
}

export function barcode(b: Box, props: Partial<Omit<BarcodeElement, 'type' | keyof Box>> = {}): BarcodeElement {
  return { ...base(b), type: 'barcode', fill: '#111111', seed: 'ticket', showText: true, text: '0042 8173 9921', ...props }
}

export function perforation(
  b: Box,
  props: Partial<Omit<PerforationElement, 'type' | keyof Box>> = {},
): PerforationElement {
  return { ...base(b), type: 'perforation', stroke: '#ffffff', orientation: 'vertical', dotSize: 6, gap: 14, ...props }
}
