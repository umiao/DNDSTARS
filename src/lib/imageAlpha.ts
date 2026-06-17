export type CircleMaskKind = 'knockback' | 'burning' | 'ignite'

/** 图标资源版本，更新 PNG 后递增以绕过浏览器缓存 */
const ICON_CACHE_VERSION = 18

export interface StripIconOptions {
  /** 状态图标：仅去掉彩色外圈以外的底，保留圆内白色 */
  circleMask?: CircleMaskKind
  /** 只移除浅色棋盘格，保留图标内部的暗色背景。 */
  preserveDarkInterior?: boolean
  /** 中心区域视为图标主体，主体内的白色高光不透明化。 */
  preserveCenterRadiusRatio?: number
}

function isCheckerboardBg(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const spread = max - min
  if (spread <= 32) {
    if (max <= 52) return true
    if (max >= 78) return true
  }
  return false
}

/** 击飞：蓝色外圈描边 */
function isKnockbackRingPixel(r: number, g: number, b: number): boolean {
  return b > 90 && b >= r + 10 && b > g
}

/** 击飞图案（外圈、角色、冲击线），填白时跳过 */
function isKnockbackArtPixel(r: number, g: number, b: number): boolean {
  if (isKnockbackRingPixel(r, g, b)) return true
  if (b > 70 && b >= r - 15 && b >= g - 15) return true
  return false
}

/** 燃烧：橙红外圈描边 */
function isBurningRingPixel(r: number, g: number, b: number): boolean {
  return r >= 150 && r > g + 25 && g >= 35 && b <= 100
}

/** 燃烧图案（外圈、角色、火焰），填白时跳过 */
function isBurningArtPixel(r: number, g: number, b: number): boolean {
  if (isBurningRingPixel(r, g, b)) return true
  if (b > 80 && b >= r - 5 && b > g) return true
  if (r > 90 && r > b + 5 && g > 40) return true
  return false
}

/** 点燃：红色外圈描边 */
function isIgniteRingPixel(r: number, g: number, b: number): boolean {
  return r >= 140 && r > g + 20 && g < 100 && b < 100
}

/** 点燃图案（外圈、火焰），填白时跳过 */
function isIgniteArtPixel(r: number, g: number, b: number): boolean {
  if (isIgniteRingPixel(r, g, b)) return true
  if (r > 70 && r > b + 5 && g > 35) return true
  return false
}

function isRingPixel(kind: CircleMaskKind, r: number, g: number, b: number): boolean {
  if (kind === 'knockback') return isKnockbackRingPixel(r, g, b)
  if (kind === 'ignite') return isIgniteRingPixel(r, g, b)
  return isBurningRingPixel(r, g, b)
}

function isArtPixel(kind: CircleMaskKind, r: number, g: number, b: number): boolean {
  if (kind === 'knockback') return isKnockbackArtPixel(r, g, b)
  if (kind === 'ignite') return isIgniteArtPixel(r, g, b)
  return isBurningArtPixel(r, g, b)
}

/**
 * 状态图标：以画布中心为圆心，仅保留彩色外圈以内的所有像素（含白色圆底与图案），
 * 圆外棋盘格/黑底变透明。不做泛洪，避免误删圆内白色。
 */
function applyCircleStatusMask(
  d: Uint8ClampedArray,
  width: number,
  height: number,
  kind: CircleMaskKind,
): void {
  const cx = width / 2
  const cy = height / 2
  const minRingDist = Math.min(width, height) * 0.3

  let maxR = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (!isRingPixel(kind, d[i], d[i + 1], d[i + 2])) continue
      const dist = Math.hypot(x - cx, y - cy)
      if (dist >= minRingDist && dist > maxR) maxR = dist
    }
  }

  if (maxR <= 0) return

  const radius = maxR + 2.5
  const r2 = radius * radius
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const dx = x - cx
      const dy = y - cy
      const inside = dx * dx + dy * dy <= r2
      const r = d[i]
      const g = d[i + 1]
      const b = d[i + 2]
      const a = d[i + 3]

      if (!inside) {
        d[i + 3] = 0
        continue
      }

      if (!isArtPixel(kind, r, g, b) && (a < 20 || isCheckerboardBg(r, g, b))) {
        d[i] = 255
        d[i + 1] = 255
        d[i + 2] = 255
        d[i + 3] = 255
      }
    }
  }
}

/** 将近白/灰格棋盘背景抠为透明，供 Konva 贴图使用 */
export function stripLightBackground(
  source: CanvasImageSource,
  width: number,
  height: number,
  options?: StripIconOptions,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.drawImage(source, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  const d = imageData.data

  if (options?.circleMask) {
    applyCircleStatusMask(d, width, height, options.circleMask)
  } else {
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i]
      const g = d[i + 1]
      const b = d[i + 2]
      const max = Math.max(r, g, b)
      const pixel = i / 4
      const x = pixel % width
      const y = Math.floor(pixel / width)
      const preserveRadius = (options?.preserveCenterRadiusRatio ?? 0) * Math.min(width, height)
      const insidePreservedCenter =
        preserveRadius > 0 && Math.hypot(x - width / 2, y - height / 2) <= preserveRadius
      if (
        isCheckerboardBg(r, g, b) &&
        !insidePreservedCenter &&
        !(options?.preserveDarkInterior && max <= 52)
      ) {
        d[i + 3] = 0
      }
    }
  }

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) {
      d[i] = 0
      d[i + 1] = 0
      d[i + 2] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export function loadProcessedImage(
  url: string,
  options?: StripIconOptions,
): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      resolve(stripLightBackground(img, img.naturalWidth, img.naturalHeight, options))
    }
    img.onerror = () => resolve(null)
    img.src = `${url}?v=${ICON_CACHE_VERSION}`
  })
}

/** 直接加载已烘焙 PNG，避免运行时二次抠图破坏白底 */
function loadBakedStatusIcon(url: string): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = () => resolve(null)
    img.src = `${url}?v=${ICON_CACHE_VERSION}`
  })
}

export function loadKnockbackIcon(): Promise<HTMLCanvasElement | null> {
  return loadBakedStatusIcon('/icons/knockback.png')
}

export function loadBurningIcon(): Promise<HTMLCanvasElement | null> {
  return loadBakedStatusIcon('/icons/burning.png')
}

export function loadIgniteIcon(): Promise<HTMLCanvasElement | null> {
  return loadBakedStatusIcon('/icons/ignite.png')
}

export function loadPoisonIcon(): Promise<HTMLCanvasElement | null> {
  return loadBakedStatusIcon('/icons/poison.png')
}

export function loadEagleEyeIcon(): Promise<HTMLCanvasElement | null> {
  return loadBakedStatusIcon('/icons/eagle-eye.png')
}

export function loadDoubleArrowIcon(): Promise<HTMLCanvasElement | null> {
  return loadProcessedImage('/icons/double-arrow.png', {
    preserveCenterRadiusRatio: 0.48,
    preserveDarkInterior: true,
  })
}

export function loadCalmMindIcon(): Promise<HTMLCanvasElement | null> {
  return loadBakedStatusIcon('/icons/calm-mind.png')
}

export function loadHuntingMarkIcon(): Promise<HTMLCanvasElement | null> {
  return loadBakedStatusIcon('/icons/hunting-mark.svg')
}

export function loadOutOfBreathIcon(): Promise<HTMLCanvasElement | null> {
  return loadBakedStatusIcon('/icons/out-of-breath.png')
}

export function loadSilentDrawIcon(): Promise<HTMLCanvasElement | null> {
  return loadBakedStatusIcon('/icons/silent-draw.png')
}

export function loadPreciseStrikeIcon(): Promise<HTMLCanvasElement | null> {
  return loadBakedStatusIcon('/icons/precise-strike.png')
}
