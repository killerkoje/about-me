import * as THREE from 'three'
import type { CaseStudy } from '@/app/design-preview/data'

export type BookCoverFields = Pick<CaseStudy, 'id' | 'title' | 'category'>

const portraitTextureCache = new Map<string, THREE.CanvasTexture>()

export const LIME = '#c8e64a'
export const ORANGE = '#e8572a'
export const YELLOW = '#f5c842'
export const MINT = '#dce8d5'
export const INK = '#2a2a2a'

export const PALETTE = [
  { bg: LIME, ink: INK },
  { bg: ORANGE, ink: '#ffffff' },
  { bg: YELLOW, ink: INK },
  { bg: LIME, ink: INK },
]

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
) {
  const chars = text.split('')
  let line = ''
  let cy = y
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy)
      line = ch
      cy += lineH
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
}

export function drawDoodle(ctx: CanvasRenderingContext2D, variant: number, ink: string, w: number, h: number) {
  ctx.strokeStyle = ink
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.globalAlpha = 0.28

  if (variant === 0) {
    ctx.strokeRect(w * 0.25, h * 0.18, w * 0.5, h * 0.22)
    ctx.beginPath(); ctx.moveTo(w * 0.32, h * 0.28); ctx.lineTo(w * 0.68, h * 0.28); ctx.stroke()
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.58, w * 0.1, 0, Math.PI * 2); ctx.stroke()
  } else if (variant === 1) {
    ctx.strokeRect(w * 0.18, h * 0.2, w * 0.64, h * 0.32)
    ctx.strokeRect(w * 0.25, h * 0.38, w * 0.2, h * 0.14)
    ctx.strokeRect(w * 0.55, h * 0.38, w * 0.2, h * 0.14)
  } else if (variant === 2) {
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.32, w * 0.14, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeRect(w * 0.32, h * 0.52, w * 0.36, h * 0.18)
  } else {
    ctx.strokeRect(w * 0.24, h * 0.2, w * 0.52, h * 0.42)
    ctx.beginPath(); ctx.moveTo(w * 0.24, h * 0.32); ctx.lineTo(w * 0.76, h * 0.32); ctx.stroke()
    ctx.strokeRect(w * 0.32, h * 0.4, w * 0.14, h * 0.18)
    ctx.strokeRect(w * 0.54, h * 0.4, w * 0.14, h * 0.18)
  }
  ctx.globalAlpha = 1
}

export type PanelTextureOpts = {
  title: string
  subtitle?: string
  value?: string
  colorIndex?: number
  variant?: number
  portrait?: boolean
}

export function createPanelTexture({
  title,
  subtitle,
  value,
  colorIndex = 0,
  variant = 0,
  portrait = false,
}: PanelTextureOpts) {
  const palette = PALETTE[colorIndex % PALETTE.length]
  const canvas = document.createElement('canvas')
  canvas.width = portrait ? 400 : 512
  canvas.height = portrait ? 560 : 320
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = palette.bg
  ctx.fillRect(0, 0, w, h)
  drawDoodle(ctx, variant, palette.ink, w, h)

  ctx.strokeStyle = palette.ink
  ctx.globalAlpha = 0.12
  ctx.lineWidth = 3
  ctx.strokeRect(32, 32, w - 64, h - 64)
  ctx.globalAlpha = 1

  ctx.fillStyle = palette.ink

  if (subtitle) {
    ctx.globalAlpha = 0.55
    ctx.font = '700 22px system-ui, sans-serif'
    ctx.fillText(subtitle.toUpperCase(), 40, 56)
    ctx.globalAlpha = 1
  }

  if (value) {
    ctx.font = '900 72px system-ui, sans-serif'
    ctx.fillText(value, 40, portrait ? h - 120 : h - 48)
  }

  ctx.font = value ? '900 26px system-ui, sans-serif' : portrait ? '900 32px system-ui, sans-serif' : '900 28px system-ui, sans-serif'
  const titleY = value ? (portrait ? h - 72 : 56) : portrait ? h - 80 : h - 56
  wrapText(ctx, title, 40, titleY, w - 80, value ? 30 : 36)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createCardTextureFromProject(project: CaseStudy, index: number) {
  const palette = PALETTE[index % PALETTE.length]
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 720
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = palette.bg
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.globalAlpha = 0.28
  drawDoodle(ctx, index % 4, palette.ink, w, h)
  ctx.restore()

  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 3
  ctx.strokeRect(36, 36, w - 72, h - 72)

  ctx.fillStyle = palette.ink
  ctx.globalAlpha = 0.45
  ctx.font = '900 52px system-ui, sans-serif'
  ctx.fillText(String(index + 1).padStart(2, '0'), 48, 96)
  ctx.globalAlpha = 0.55
  ctx.font = '700 26px system-ui, sans-serif'
  ctx.fillText(project.category.toUpperCase(), 48, h - 130)
  ctx.globalAlpha = 1
  ctx.font = '900 38px system-ui, sans-serif'
  wrapText(ctx, project.title, 48, h - 88, w - 96, 44)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Portrait book cover — tall format for shelf */
export function createBookPortraitTexture(project: BookCoverFields, index: number) {
  const cached = portraitTextureCache.get(project.id)
  if (cached) return cached

  const palette = PALETTE[index % PALETTE.length]
  const canvas = document.createElement('canvas')
  canvas.width = 480
  canvas.height = 680
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = palette.bg
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.globalAlpha = 0.26
  drawDoodle(ctx, index % 4, palette.ink, w, h)
  ctx.restore()

  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 3
  ctx.strokeRect(32, 32, w - 64, h - 64)

  ctx.fillStyle = palette.ink
  ctx.globalAlpha = 0.45
  ctx.font = '900 72px system-ui, sans-serif'
  ctx.fillText(String(index + 1).padStart(2, '0'), 44, 100)
  ctx.globalAlpha = 0.55
  ctx.font = '700 22px system-ui, sans-serif'
  ctx.fillText(project.category.toUpperCase(), 44, h - 72)
  ctx.globalAlpha = 1
  ctx.font = '900 34px system-ui, sans-serif'
  wrapText(ctx, project.title, 44, h - 44, w - 88, 42)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  portraitTextureCache.set(project.id, texture)
  return texture
}

/** Landscape book cover — matches horizontal booklet on shelf */
export function createBookCoverTexture(project: CaseStudy, index: number) {
  const palette = PALETTE[index % PALETTE.length]
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 640
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = palette.bg
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.globalAlpha = 0.26
  drawDoodle(ctx, index % 4, palette.ink, w, h)
  ctx.restore()

  ctx.strokeStyle = 'rgba(0,0,0,0.1)'
  ctx.lineWidth = 4
  ctx.strokeRect(40, 40, w - 80, h - 80)

  ctx.fillStyle = palette.ink
  ctx.globalAlpha = 0.4
  ctx.font = '900 88px system-ui, sans-serif'
  ctx.fillText(String(index + 1).padStart(2, '0'), 52, 120)
  ctx.globalAlpha = 0.55
  ctx.font = '700 28px system-ui, sans-serif'
  ctx.fillText(project.category.toUpperCase(), 52, h - 56)
  ctx.globalAlpha = 1
  ctx.font = '900 44px system-ui, sans-serif'
  wrapText(ctx, project.title, 52, 200, w - 104, 52)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  return texture
}

export type CardSize = { w: number; h: number; d: number }

export const CARD_SIZES = {
  stat: { w: 0.95, h: 0.72, d: 0.05 },
  meta: { w: 0.72, h: 0.58, d: 0.045 },
  panel: { w: 1.35, h: 0.78, d: 0.05 },
  portrait: { w: 0.62, h: 0.92, d: 0.045 },
  list: { w: 2.8, h: 0.52, d: 0.04 },
} as const satisfies Record<string, CardSize>
