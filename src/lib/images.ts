import { useEffect, useState } from 'react'

const cache = new Map<string, HTMLImageElement>()
const pending = new Map<string, Promise<HTMLImageElement>>()

export function getCachedImage(src: string): HTMLImageElement | undefined {
  return cache.get(src)
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = cache.get(src)
  if (cached) return Promise.resolve(cached)
  const inflight = pending.get(src)
  if (inflight) return inflight
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous'
    img.onload = () => {
      cache.set(src, img)
      pending.delete(src)
      resolve(img)
    }
    img.onerror = () => {
      pending.delete(src)
      reject(new Error('Failed to load image'))
    }
    img.src = src
  })
  pending.set(src, p)
  return p
}

/** React hook returning the loaded HTMLImageElement for a src (or undefined while loading). */
export function useImageEl(src: string | undefined): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement | undefined>(() => (src ? cache.get(src) : undefined))
  useEffect(() => {
    if (!src) {
      setImg(undefined)
      return
    }
    const cached = cache.get(src)
    if (cached) {
      setImg(cached)
      return
    }
    let active = true
    loadImage(src)
      .then((i) => {
        if (active) setImg(i)
      })
      .catch(() => {
        if (active) setImg(undefined)
      })
    return () => {
      active = false
    }
  }, [src])
  return img
}

/** Read a File into a data URL, downscaling very large images so documents stay light. */
export function fileToDataURL(file: File, maxDim = 2400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const raw = String(reader.result)
      const img = new Image()
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img
        if (Math.max(w, h) <= maxDim || file.type === 'image/svg+xml') {
          resolve(raw)
          return
        }
        const scale = maxDim / Math.max(w, h)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(w * scale)
        canvas.height = Math.round(h * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(raw)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const hasAlpha = file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/gif'
        resolve(hasAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92))
      }
      img.onerror = () => reject(new Error('Unsupported image'))
      img.src = raw
    }
    reader.readAsDataURL(file)
  })
}
