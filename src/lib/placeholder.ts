/** An inline SVG used by templates as a "drop your photo here" image. */
export function placeholderImage(w: number, h: number, label = 'YOUR PHOTO', color = '#9aa3b2', bg = '#e7ebf0'): string {
  const font = Math.round(Math.min(w, h) / 9)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <g fill="none" stroke="${color}" stroke-width="${Math.max(2, font / 8)}">
    <rect x="${w * 0.3}" y="${h * 0.22}" width="${w * 0.4}" height="${h * 0.4}" rx="${font / 3}"/>
    <circle cx="${w * 0.42}" cy="${h * 0.36}" r="${font / 3}"/>
    <path d="M${w * 0.3} ${h * 0.56} l${w * 0.12} -${h * 0.14} l${w * 0.1} ${h * 0.1} l${w * 0.06} -${h * 0.06} l${w * 0.12} ${h * 0.12}"/>
  </g>
  <text x="50%" y="${h * 0.78}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${font}" letter-spacing="${font / 6}" fill="${color}">${label}</text>
</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}
