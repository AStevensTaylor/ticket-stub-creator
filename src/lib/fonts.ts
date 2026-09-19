export interface FontOption {
  label: string
  family: string
  google?: string
}

export const FONTS: FontOption[] = [
  { label: 'Oswald', family: 'Oswald', google: 'Oswald:wght@400;500;700' },
  { label: 'Bebas Neue', family: 'Bebas Neue', google: 'Bebas+Neue' },
  { label: 'Playfair Display', family: 'Playfair Display', google: 'Playfair+Display:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'Anton', family: 'Anton', google: 'Anton' },
  { label: 'Special Elite', family: 'Special Elite', google: 'Special+Elite' },
  { label: 'Courier Prime', family: 'Courier Prime', google: 'Courier+Prime:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'Inter', family: 'Inter', google: 'Inter:wght@400;500;600;700' },
  { label: 'Lora', family: 'Lora', google: 'Lora:ital,wght@0,400;0,700;1,400;1,700' },
  { label: 'Pacifico', family: 'Pacifico', google: 'Pacifico' },
  { label: 'Rye', family: 'Rye', google: 'Rye' },
  { label: 'Limelight', family: 'Limelight', google: 'Limelight' },
  { label: 'Monoton', family: 'Monoton', google: 'Monoton' },
  { label: 'Arial', family: 'Arial' },
  { label: 'Georgia', family: 'Georgia' },
  { label: 'Times New Roman', family: 'Times New Roman' },
  { label: 'Courier New', family: 'Courier New' },
]

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  FONTS.filter((f) => f.google)
    .map((f) => `family=${f.google}`)
    .join('&') +
  '&display=swap'

/** Resolve once all web fonts are loaded so the canvas can measure text correctly. */
export async function waitForFonts(): Promise<void> {
  if (!('fonts' in document)) return
  try {
    await Promise.all(
      FONTS.filter((f) => f.google).flatMap((f) => [
        document.fonts.load(`16px "${f.family}"`),
        document.fonts.load(`bold 16px "${f.family}"`),
      ]),
    )
    await document.fonts.ready
  } catch {
    /* ignore: fall back to system fonts */
  }
}
