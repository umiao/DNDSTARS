import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const input = join(__dirname, '../public/flame.png')

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

for (let i = 0; i < data.length; i += 4) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max - min
  const avg = (r + g + b) / 3

  // 去掉白/灰背景 + 火焰外围白色光晕（保留黄/橙/红主体）
  const isWhite = r > 245 && g > 245 && b > 245
  const isGrayBg = sat < 18 && min > 185
  const isWhiteGlow = sat < 52 && min > 125 && avg > 162
  const isPaleFringe = sat < 65 && min > 190
  const isNearWhite = r > 228 && g > 215 && b > 195 && sat < 48

  if (isWhite || isGrayBg || isWhiteGlow || isPaleFringe || isNearWhite) {
    data[i + 3] = 0
  }
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(input)

console.log('Processed flame.png — removed white/gray background')
