import { inch, type Background, type TicketDocument, type TicketElement } from '../types'
import { uid } from '../lib/id'
import { placeholderImage } from '../lib/placeholder'
import { barcode, ellipse, image, line, perforation, rect, text } from './builders'

export interface Template {
  id: string
  name: string
  description: string
  width: number
  height: number
  build: () => TicketDocument
}

function doc(t: Omit<TicketDocument, 'id'>): TicketDocument {
  return { id: uid('doc'), ...t }
}

const solid = (color: string): Background => ({ type: 'solid', color })
const gradient = (color: string, color2: string, angle = 90): Background => ({ type: 'gradient', color, color2, angle })

/* ---------------------------------------------------------------- Concert */
function concert(): TicketDocument {
  const W = inch(5.5)
  const H = inch(2)
  const stubX = 1250
  const gold = '#f2c14e'
  const els: TicketElement[] = [
    rect({ x: 0, y: 0, width: W, height: 24 }, { fill: gold }),
    rect({ x: 0, y: H - 24, width: W, height: 24 }, { fill: gold }),
    text({ x: 60, y: 58, width: 600, height: 46 }, { text: 'ADMIT ONE  ·  GENERAL ADMISSION', fontSize: 30, fill: gold, letterSpacing: 6, fontStyle: 'bold' }),
    text({ x: 60, y: 108, width: 1150, height: 140 }, { text: 'THE MIDNIGHT ECHO', fontFamily: 'Bebas Neue', fontSize: 140, fill: '#ffffff', lineHeight: 1 }),
    text({ x: 60, y: 252, width: 1150, height: 50 }, { text: 'LIVE IN CONCERT  ·  THE AFTERGLOW WORLD TOUR', fontSize: 34, fill: gold, letterSpacing: 4 }),
    line({ x: 60, y: 322, width: 1150, height: 0 }, { stroke: 'rgba(255,255,255,0.35)', strokeWidth: 3 }),
    text({ x: 60, y: 345, width: 1150, height: 48 }, { text: 'The Grand Arena  ·  Chicago, IL', fontFamily: 'Inter', fontSize: 38, fill: '#e8ecf5' }),
    text({ x: 60, y: 430, width: 320, height: 110 }, { text: 'DATE\nSAT 14 JUN 2026', fontSize: 34, fill: '#ffffff', lineHeight: 1.3 }),
    text({ x: 420, y: 430, width: 300, height: 110 }, { text: 'DOORS\n7:00 PM', fontSize: 34, fill: '#ffffff', lineHeight: 1.3 }),
    text({ x: 760, y: 430, width: 450, height: 110 }, { text: 'SECTION\nFLOOR A  ·  ROW 3  ·  SEAT 12', fontSize: 34, fill: '#ffffff', lineHeight: 1.3 }),
    perforation({ x: stubX, y: 30, width: 0, height: H - 60 }, { stroke: 'rgba(255,255,255,0.7)' }),
    text({ x: stubX + 40, y: 58, width: 320, height: 40 }, { text: 'ADMIT ONE', fontSize: 28, fill: gold, letterSpacing: 6, fontStyle: 'bold', align: 'center' }),
    text({ x: stubX + 40, y: 108, width: 320, height: 130 }, { text: 'THE MIDNIGHT\nECHO', fontFamily: 'Bebas Neue', fontSize: 64, fill: '#ffffff', align: 'center', lineHeight: 0.95 }),
    text({ x: stubX + 40, y: 262, width: 320, height: 90 }, { text: 'SAT 14 JUN 2026\nFLOOR A · ROW 3 · SEAT 12', fontSize: 26, fill: '#e8ecf5', align: 'center', lineHeight: 1.35 }),
    barcode({ x: stubX + 60, y: 370, width: 280, height: 150 }, { fill: '#ffffff', seed: 'echo', text: '0042 8173 9921' }),
  ]
  return doc({
    name: 'Concert Ticket',
    width: W,
    height: H,
    background: gradient('#1b1f3a', '#2d1b4e', 20),
    cornerRadius: 24,
    elements: els,
    templateId: 'concert',
  })
}

/* ----------------------------------------------------------------- Cinema */
function cinema(): TicketDocument {
  const W = inch(5.5)
  const H = inch(2.25)
  const red = '#b3261e'
  const ink = '#2b1d16'
  const stubX = 1210
  const els: TicketElement[] = [
    rect({ x: 0, y: 0, width: W, height: 96 }, { fill: red }),
    rect({ x: 0, y: H - 60, width: W, height: 60 }, { fill: red }),
    text({ x: 0, y: 24, width: stubX, height: 50 }, { text: 'CINEMA  ·  ADMIT ONE  ·  CINEMA  ·  ADMIT ONE', fontFamily: 'Special Elite', fontSize: 34, fill: '#fff4e6', align: 'center', letterSpacing: 4 }),
    text({ x: 60, y: 150, width: stubX - 120, height: 130 }, { text: 'CASABLANCA', fontFamily: 'Limelight', fontSize: 120, fill: ink, align: 'center', lineHeight: 1 }),
    text({ x: 60, y: 292, width: stubX - 120, height: 46 }, { text: '—  A NIGHT AT THE MOVIES  —', fontFamily: 'Special Elite', fontSize: 32, fill: red, align: 'center', letterSpacing: 3 }),
    line({ x: 90, y: 365, width: stubX - 180, height: 0 }, { stroke: ink, strokeWidth: 3, dash: [12, 10] }),
    text({ x: 90, y: 400, width: 320, height: 110 }, { text: 'SCREEN\n3', fontFamily: 'Courier Prime', fontSize: 34, fill: ink, fontStyle: 'bold', align: 'center', lineHeight: 1.3 }),
    text({ x: 430, y: 400, width: 360, height: 110 }, { text: 'DATE\nFRI 20 FEB 2026', fontFamily: 'Courier Prime', fontSize: 34, fill: ink, fontStyle: 'bold', align: 'center', lineHeight: 1.3 }),
    text({ x: 810, y: 400, width: 310, height: 110 }, { text: 'SEATS\nH12 · H13', fontFamily: 'Courier Prime', fontSize: 34, fill: ink, fontStyle: 'bold', align: 'center', lineHeight: 1.3 }),
    text({ x: 60, y: 540, width: stubX - 120, height: 44 }, { text: 'THE ROXY PICTURE HOUSE  ·  7:30 PM  ·  No. 0042817', fontFamily: 'Special Elite', fontSize: 26, fill: ink, align: 'center' }),
    perforation({ x: stubX, y: 110, width: 0, height: H - 185 }, { stroke: ink, dotSize: 6, gap: 12 }),
    text({ x: stubX + 30, y: 130, width: W - stubX - 60, height: 50 }, { text: 'ADMIT ONE', fontFamily: 'Special Elite', fontSize: 34, fill: red, align: 'center', fontStyle: 'bold', letterSpacing: 4 }),
    text({ x: stubX + 30, y: 200, width: W - stubX - 60, height: 200 }, { text: 'CASABLANCA\n\nFRI 20 FEB\n7:30 PM\nSEAT H12', fontFamily: 'Courier Prime', fontSize: 30, fill: ink, align: 'center', lineHeight: 1.25, fontStyle: 'bold' }),
    barcode({ x: stubX + 60, y: 440, width: W - stubX - 120, height: 130 }, { fill: ink, seed: 'roxy', text: '0042817' }),
  ]
  return doc({
    name: 'Cinema Ticket',
    width: W,
    height: H,
    background: solid('#f6ecd9'),
    cornerRadius: 12,
    elements: els,
    templateId: 'cinema',
  })
}

/* ----------------------------------------------------------------- Sports */
function sports(): TicketDocument {
  const W = inch(6)
  const H = inch(2.5)
  const green = '#0f7a3d'
  const dark = '#0b1a12'
  const lime = '#c7f464'
  const photoW = 620
  const stubX = W - 440
  const els: TicketElement[] = [
    image({ x: 0, y: 0, width: photoW, height: H }, placeholderImage(photoW, H, 'TEAM PHOTO', '#7fa88f', '#153a25')),
    rect({ x: photoW - 40, y: 0, width: 90, height: H }, { fill: lime, rotation: 0 }),
    text({ x: photoW + 90, y: 60, width: 720, height: 44 }, { text: 'SEASON 2026  ·  HOME GAME  ·  SECTION 114', fontSize: 30, fill: lime, letterSpacing: 4, fontStyle: 'bold' }),
    text({ x: photoW + 90, y: 110, width: 720, height: 240 }, { text: 'RIVERSIDE\nROVERS', fontFamily: 'Anton', fontSize: 120, fill: '#ffffff', lineHeight: 0.92 }),
    text({ x: photoW + 90, y: 352, width: 720, height: 60 }, { text: 'vs  HARBOUR CITY UNITED', fontFamily: 'Oswald', fontSize: 44, fill: lime, fontStyle: 'bold' }),
    line({ x: photoW + 90, y: 435, width: 640, height: 0 }, { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 3 }),
    text({ x: photoW + 90, y: 460, width: 210, height: 110 }, { text: 'DATE\nSUN 3 MAY', fontSize: 32, fill: '#ffffff', lineHeight: 1.3 }),
    text({ x: photoW + 320, y: 460, width: 200, height: 110 }, { text: 'KICK-OFF\n3:00 PM', fontSize: 32, fill: '#ffffff', lineHeight: 1.3 }),
    text({ x: photoW + 540, y: 460, width: 260, height: 110 }, { text: 'SEAT\nBLOCK C · ROW 12 · 7', fontSize: 32, fill: '#ffffff', lineHeight: 1.3 }),
    text({ x: photoW + 90, y: 610, width: 720, height: 90 }, { text: 'Riverside Stadium  ·  Gate 4  ·  Ticket No. 116-0987', fontFamily: 'Inter', fontSize: 30, fill: 'rgba(255,255,255,0.75)' }),
    perforation({ x: stubX, y: 40, width: 0, height: H - 80 }, { stroke: 'rgba(255,255,255,0.6)' }),
    rect({ x: stubX + 40, y: 60, width: 360, height: 70 }, { fill: green, cornerRadius: 12 }),
    text({ x: stubX + 40, y: 72, width: 360, height: 50 }, { text: 'HOME GAME', fontSize: 40, fill: '#ffffff', align: 'center', fontStyle: 'bold', letterSpacing: 4 }),
    text({ x: stubX + 40, y: 160, width: 360, height: 200 }, { text: 'ROVERS\nvs UNITED', fontFamily: 'Anton', fontSize: 64, fill: '#ffffff', align: 'center', lineHeight: 1 }),
    text({ x: stubX + 40, y: 320, width: 360, height: 140 }, { text: 'SUN 3 MAY · 3:00 PM\nBLOCK C · ROW 12 · SEAT 7', fontSize: 28, fill: lime, align: 'center', lineHeight: 1.35 }),
    barcode({ x: stubX + 80, y: 470, width: 280, height: 190 }, { fill: '#ffffff', seed: 'rovers', text: '116-0987' }),
  ]
  return doc({
    name: 'Sports Ticket',
    width: W,
    height: H,
    background: gradient(dark, '#15321f', 0),
    cornerRadius: 20,
    elements: els,
    templateId: 'sports',
  })
}

/* ------------------------------------------------------------ Golden gift */
function golden(): TicketDocument {
  const W = inch(5.5)
  const H = inch(2)
  const ink = '#4a2f04'
  const els: TicketElement[] = [
    rect({ x: 24, y: 24, width: W - 48, height: H - 48 }, { fill: 'rgba(255,255,255,0)', stroke: ink, strokeWidth: 5, cornerRadius: 16 }),
    rect({ x: 40, y: 40, width: W - 80, height: H - 80 }, { fill: 'rgba(255,255,255,0)', stroke: ink, strokeWidth: 2, cornerRadius: 10, dash: [16, 10] }),
    text({ x: 80, y: 70, width: W - 160, height: 48 }, { text: '✦  THIS TICKET ENTITLES THE BEARER TO  ✦', fontFamily: 'Playfair Display', fontSize: 30, fill: ink, align: 'center', letterSpacing: 3 }),
    text({ x: 80, y: 120, width: W - 160, height: 150 }, { text: 'GOLDEN TICKET', fontFamily: 'Rye', fontSize: 118, fill: ink, align: 'center', lineHeight: 1 }),
    text({ x: 80, y: 272, width: W - 160, height: 60 }, { text: 'One unforgettable day out, chosen by you', fontFamily: 'Playfair Display', fontSize: 40, fill: ink, align: 'center', fontStyle: 'italic' }),
    line({ x: 200, y: 352, width: W - 400, height: 0 }, { stroke: ink, strokeWidth: 3 }),
    text({ x: 80, y: 372, width: 500, height: 90 }, { text: 'FOR\nSam', fontFamily: 'Playfair Display', fontSize: 34, fill: ink, align: 'center', lineHeight: 1.3, fontStyle: 'bold' }),
    text({ x: 575, y: 372, width: 500, height: 90 }, { text: 'FROM\nAlex', fontFamily: 'Playfair Display', fontSize: 34, fill: ink, align: 'center', lineHeight: 1.3, fontStyle: 'bold' }),
    text({ x: 1070, y: 372, width: 500, height: 90 }, { text: 'REDEEM BY\nAnytime', fontFamily: 'Playfair Display', fontSize: 34, fill: ink, align: 'center', lineHeight: 1.3, fontStyle: 'bold' }),
    text({ x: 80, y: 490, width: W - 160, height: 40 }, { text: 'No. 000001  ·  NON-TRANSFERABLE  ·  VALID FOREVER', fontFamily: 'Playfair Display', fontSize: 24, fill: ink, align: 'center', letterSpacing: 2 }),
  ]
  return doc({
    name: 'Golden Ticket',
    width: W,
    height: H,
    background: gradient('#f9d976', '#d4a017', 135),
    cornerRadius: 30,
    elements: els,
    templateId: 'golden',
  })
}

/* ------------------------------------------------------------ Boarding pass */
function boarding(): TicketDocument {
  const W = inch(7.5)
  const H = inch(3)
  const navy = '#0d2a52'
  const sky = '#e9f1fb'
  const stubX = 1600
  const els: TicketElement[] = [
    rect({ x: 0, y: 0, width: W, height: 130 }, { fill: navy }),
    text({ x: 60, y: 38, width: 900, height: 60 }, { text: 'BOARDING PASS', fontSize: 52, fill: '#ffffff', fontStyle: 'bold', letterSpacing: 8 }),
    text({ x: stubX + 40, y: 38, width: 560, height: 60 }, { text: 'BOARDING PASS', fontSize: 40, fill: '#ffffff', fontStyle: 'bold', letterSpacing: 6, align: 'center' }),
    text({ x: 1000, y: 40, width: 540, height: 60 }, { text: 'FLIGHT  GF 2026  ·  ECONOMY', fontSize: 34, fill: '#c6d6ee', align: 'right', letterSpacing: 3 }),
    text({ x: 60, y: 165, width: 400, height: 40 }, { text: 'FROM', fontSize: 26, fill: '#5c6f8a', letterSpacing: 4 }),
    text({ x: 60, y: 200, width: 460, height: 190 }, { text: 'LHR', fontFamily: 'Anton', fontSize: 180, fill: navy, lineHeight: 1 }),
    text({ x: 60, y: 385, width: 460, height: 40 }, { text: 'London Heathrow', fontFamily: 'Inter', fontSize: 30, fill: '#33415c' }),
    text({ x: 560, y: 245, width: 180, height: 120 }, { text: '✈', fontFamily: 'Arial', fontSize: 110, fill: '#c9a227', align: 'center' }),
    text({ x: 780, y: 165, width: 400, height: 40 }, { text: 'TO', fontSize: 26, fill: '#5c6f8a', letterSpacing: 4 }),
    text({ x: 780, y: 200, width: 460, height: 190 }, { text: 'JFK', fontFamily: 'Anton', fontSize: 180, fill: navy, lineHeight: 1 }),
    text({ x: 780, y: 385, width: 460, height: 40 }, { text: 'New York', fontFamily: 'Inter', fontSize: 30, fill: '#33415c' }),
    rect({ x: 1250, y: 160, width: 300, height: 270 }, { fill: sky, cornerRadius: 16 }),
    text({ x: 1250, y: 190, width: 300, height: 120 }, { text: 'GATE\nB22', fontSize: 40, fill: navy, align: 'center', lineHeight: 1.2, fontStyle: 'bold' }),
    text({ x: 1250, y: 310, width: 300, height: 120 }, { text: 'SEAT\n14A', fontSize: 40, fill: navy, align: 'center', lineHeight: 1.2, fontStyle: 'bold' }),
    line({ x: 60, y: 470, width: 1490, height: 0 }, { stroke: '#c6d6ee', strokeWidth: 3 }),
    text({ x: 60, y: 500, width: 420, height: 110 }, { text: 'PASSENGER\nJORDAN TAYLOR', fontSize: 34, fill: navy, lineHeight: 1.3 }),
    text({ x: 520, y: 500, width: 330, height: 110 }, { text: 'DATE\n12 SEP 2026', fontSize: 34, fill: navy, lineHeight: 1.3 }),
    text({ x: 880, y: 500, width: 300, height: 110 }, { text: 'BOARDING\n09:40', fontSize: 34, fill: navy, lineHeight: 1.3 }),
    text({ x: 1210, y: 500, width: 340, height: 110 }, { text: 'DEPARTS\n10:25', fontSize: 34, fill: navy, lineHeight: 1.3 }),
    barcode({ x: 60, y: 660, width: 700, height: 160 }, { fill: navy, seed: 'GF2026', showText: false, text: '' }),
    text({ x: 800, y: 700, width: 750, height: 80 }, { text: 'A gift for your next adventure — pack your bags!', fontFamily: 'Lora', fontSize: 34, fill: '#33415c', fontStyle: 'italic', align: 'right' }),
    perforation({ x: stubX, y: 150, width: 0, height: H - 200 }, { stroke: navy, dotSize: 6, gap: 12 }),
    text({ x: stubX + 40, y: 165, width: 560, height: 160 }, { text: 'LHR  →  JFK', fontFamily: 'Anton', fontSize: 84, fill: navy, align: 'center', lineHeight: 1.6 }),
    text({ x: stubX + 40, y: 330, width: 560, height: 300 }, { text: 'JORDAN TAYLOR\n\nFLIGHT  GF 2026\nDATE  12 SEP 2026\nGATE  B22  ·  SEAT  14A\nBOARDING  09:40', fontSize: 30, fill: navy, align: 'center', lineHeight: 1.35 }),
    barcode({ x: stubX + 120, y: 680, width: 400, height: 140 }, { fill: navy, seed: 'GF2026', showText: false, text: '' }),
  ]
  return doc({
    name: 'Boarding Pass',
    width: W,
    height: H,
    background: solid('#ffffff'),
    cornerRadius: 24,
    elements: els,
    templateId: 'boarding',
  })
}

/* ------------------------------------------------------------ Event pass */
function eventPass(): TicketDocument {
  const W = inch(3.5)
  const H = inch(5.5)
  const purple = '#5b21b6'
  const els: TicketElement[] = [
    rect({ x: 0, y: 0, width: W, height: 640 }, { fill: purple }),
    ellipse({ x: W / 2 - 60, y: 40, width: 120, height: 50 }, { fill: '#ffffff' }),
    text({ x: 60, y: 130, width: W - 120, height: 48 }, { text: 'ALL ACCESS  ·  VIP', fontSize: 34, fill: '#f5d0fe', align: 'center', letterSpacing: 8, fontStyle: 'bold' }),
    text({ x: 60, y: 190, width: W - 120, height: 200 }, { text: 'BIRTHDAY\nWEEKENDER', fontFamily: 'Bebas Neue', fontSize: 100, fill: '#ffffff', align: 'center', lineHeight: 0.95 }),
    text({ x: 60, y: 400, width: W - 120, height: 60 }, { text: '3 – 5 OCTOBER 2026', fontSize: 40, fill: '#f5d0fe', align: 'center' }),
    image({ x: (W - 520) / 2, y: 480, width: 520, height: 520 }, placeholderImage(520, 520, 'GUEST PHOTO'), { cornerRadius: 260, stroke: '#ffffff', strokeWidth: 14 }),
    text({ x: 60, y: 1040, width: W - 120, height: 80 }, { text: 'Priya Sharma', fontFamily: 'Playfair Display', fontSize: 64, fill: '#1e1b4b', align: 'center', fontStyle: 'bold' }),
    text({ x: 60, y: 1125, width: W - 120, height: 50 }, { text: 'GUEST OF HONOUR', fontSize: 30, fill: purple, align: 'center', letterSpacing: 6 }),
    line({ x: 160, y: 1210, width: W - 320, height: 0 }, { stroke: '#ddd6fe', strokeWidth: 4 }),
    text({ x: 60, y: 1240, width: (W - 120) / 2, height: 110 }, { text: 'VENUE\nLakeside Lodge', fontFamily: 'Inter', fontSize: 30, fill: '#1e1b4b', align: 'center', lineHeight: 1.3 }),
    text({ x: W / 2, y: 1240, width: (W - 120) / 2, height: 110 }, { text: 'CHECK-IN\nFri 4:00 PM', fontFamily: 'Inter', fontSize: 30, fill: '#1e1b4b', align: 'center', lineHeight: 1.3 }),
    barcode({ x: 200, y: 1400, width: W - 400, height: 170 }, { fill: '#1e1b4b', seed: 'priya', text: 'VIP-0001' }),
  ]
  return doc({
    name: 'Event Pass',
    width: W,
    height: H,
    background: solid('#ffffff'),
    cornerRadius: 40,
    elements: els,
    templateId: 'event-pass',
  })
}

/* ------------------------------------------------------------------ Blank */
function blank(): TicketDocument {
  return doc({
    name: 'Blank Ticket',
    width: inch(5.5),
    height: inch(2),
    background: solid('#ffffff'),
    cornerRadius: 16,
    elements: [],
    templateId: 'blank',
  })
}

export const TEMPLATES: Template[] = [
  { id: 'concert', name: 'Concert', description: '5.5 × 2 in · stub on the right', width: inch(5.5), height: inch(2), build: concert },
  { id: 'cinema', name: 'Cinema', description: '5.5 × 2.25 in · vintage movie ticket', width: inch(5.5), height: inch(2.25), build: cinema },
  { id: 'sports', name: 'Sports', description: '6 × 2.5 in · photo panel + stub', width: inch(6), height: inch(2.5), build: sports },
  { id: 'golden', name: 'Golden Ticket', description: '5.5 × 2 in · gift voucher style', width: inch(5.5), height: inch(2), build: golden },
  { id: 'boarding', name: 'Boarding Pass', description: '7.5 × 3 in · travel gift', width: inch(7.5), height: inch(3), build: boarding },
  { id: 'event-pass', name: 'Event Pass', description: '3.5 × 5.5 in · portrait lanyard pass', width: inch(3.5), height: inch(5.5), build: eventPass },
  { id: 'blank', name: 'Blank', description: '5.5 × 2 in · start from scratch', width: inch(5.5), height: inch(2), build: blank },
]

export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
