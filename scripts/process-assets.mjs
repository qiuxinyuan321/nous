/**
 * 把 gpt-image-2 生成的原始 PNG 处理成生产可用资产：
 *   - hero：1536x1024 → 1600w webp q80，~150-300KB
 *   - persona 印章：1024 方形 PNG → 抠白底为透明 → 256x256 webp
 *
 * 纯 Node · 用已装的 sharp · 不依赖外部 CLI。
 *
 * 用法：node scripts/process-assets.mjs
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const SRC = 'C:\\Users\\Administrator\\cliproxy\\outputs'
const PUBLIC = path.resolve(process.cwd(), 'public')
const PERSONAS_DIR = path.join(PUBLIC, 'personas')

// 印章抠透明：把接近白的背景转透明，保留朱砂红字
// 策略：每个像素 RGB 转 HSV，饱和度 < 0.15 或亮度 > 0.92 → alpha=0
async function extractSeal(srcPath, dstPath, size = 256) {
  const buf = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { data, info } = buf
  const out = Buffer.alloc(data.length)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2]
    const max = Math.max(r, g, b) / 255
    const min = Math.min(r, g, b) / 255
    const v = max
    const s = max === 0 ? 0 : (max - min) / max

    out[i] = r
    out[i + 1] = g
    out[i + 2] = b

    if (v > 0.92 && s < 0.15) {
      out[i + 3] = 0
    } else if (v > 0.82 && s < 0.25) {
      // 柔和边缘
      out[i + 3] = Math.round(
        255 * ((v < 0.92 ? 1 - (v - 0.82) / 0.1 : 0) * (s > 0.15 ? 1 : (s - 0.1) / 0.05)),
      )
      if (out[i + 3] < 0) out[i + 3] = 0
      if (out[i + 3] > 255) out[i + 3] = 255
    } else {
      out[i + 3] = 255
    }
  }

  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 10 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88, alphaQuality: 95 })
    .toFile(dstPath)

  const meta = await sharp(dstPath).metadata()
  console.log(
    `  ✓ seal → ${path.relative(PUBLIC, dstPath)} (${meta.width}×${meta.height}, ${Math.round((meta.size || 0) / 1024)}KB)`,
  )
}

async function processHero(srcPath, dstPath) {
  const info = await sharp(srcPath)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(dstPath)
  console.log(
    `  ✓ hero → ${path.relative(PUBLIC, dstPath)} (${info.width}×${info.height}, ${Math.round(info.size / 1024)}KB)`,
  )
}

async function main() {
  if (!existsSync(PERSONAS_DIR)) await mkdir(PERSONAS_DIR, { recursive: true })

  // 1. hero（使用 04:05 生成的那张）
  const heroSrc = path.join(SRC, 'image-20260423-040506-1.png')
  if (existsSync(heroSrc)) {
    console.log('→ Processing hero …')
    await processHero(heroSrc, path.join(PUBLIC, 'hero.webp'))
  } else {
    console.warn(`  ⚠️  hero source not found: ${heroSrc}`)
  }

  // 2. 诸葛亮印章（04:06 生成）
  const zhugeSrc = path.join(SRC, 'image-20260423-040657-1.png')
  if (existsSync(zhugeSrc)) {
    console.log('→ Processing seal (zhuge) …')
    await extractSeal(zhugeSrc, path.join(PERSONAS_DIR, 'zhuge.webp'))
  } else {
    console.warn(`  ⚠️  zhuge source not found: ${zhugeSrc}`)
  }

  // 3. 批量处理剩余 persona 印章
  // 约定：我会在 cliproxy/outputs 下生成后标记为 seal-{persona}.png 的副本
  const otherPersonas = ['rick', 'chuxuan', 'socrates', 'zhuangzi', 'holmes']
  for (const pid of otherPersonas) {
    const marked = path.join(SRC, `seal-${pid}.png`)
    if (existsSync(marked)) {
      console.log(`→ Processing seal (${pid}) …`)
      await extractSeal(marked, path.join(PERSONAS_DIR, `${pid}.webp`))
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
