import { expect, test } from '@playwright/test'

/**
 * Landing 页 · 禅意版 Magic UI 组件回归
 *
 * 覆盖 A 阶段改造：
 * - AuroraInkText 文字渐变 + bg-clip:text 正确应用
 * - ShimmerInkButton 主 CTA 可点击并带 before 流光
 * - InkBorderBeam 挂在自托管卡片
 * - FeatureCard 的 NumberTicker 进入视口后滚到目标值
 */
test.describe('Landing · magic components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh-CN')
  })

  test('hero 标题 + AuroraInkText 带正确的 background-clip:text', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1, name: 'Nous' })
    await expect(h1).toBeVisible()

    // AuroraInkText 包在 slogan 里
    const aurora = page.locator('span.bg-clip-text').first()
    await expect(aurora).toBeVisible()

    const clipInfo = await aurora.evaluate((el) => {
      const cs = getComputedStyle(el)
      return {
        bgClip: cs.backgroundClip,
        wkBgClip: cs.webkitBackgroundClip,
        color: cs.color,
        bgSize: cs.backgroundSize,
        hasText: (el.textContent ?? '').trim().length > 0,
      }
    })
    // shorthand 不能偷偷把 bg-clip 重置回 border-box
    expect(clipInfo.bgClip).toBe('text')
    expect(clipInfo.wkBgClip).toBe('text')
    // text-transparent
    expect(clipInfo.color).toBe('rgba(0, 0, 0, 0)')
    // 动画需要的渐变尺寸
    expect(clipInfo.bgSize).toContain('200%')
    expect(clipInfo.hasText).toBe(true)
  })

  test('主 CTA 是 ShimmerInkButton（有 before 流光层）', async ({ page }) => {
    const cta = page.getByRole('link', { name: /开始使用|Get started/ }).first()
    await expect(cta).toBeVisible()

    // 流光 layer 是 before 伪元素，取其 background-image 验证
    const beforeBg = await cta.evaluate((el) => getComputedStyle(el, '::before').backgroundImage)
    // 浏览器会把 CSS 变量展开成 rgb(...)，所以只断言含 linear-gradient + 有多个颜色 stop
    expect(beforeBg).toMatch(/linear-gradient/i)
    // gold-leaf #B8955A → rgb(184, 149, 90)；转义后允许 hex or rgb
    expect(beforeBg).toMatch(/(rgb\(\s*184\s*,\s*149\s*,\s*90|#[Bb]8955[Aa])/)
  })

  test('自托管卡片带 InkBorderBeam（::before conic-gradient）', async ({ page }) => {
    // 滚到自托管区
    await page
      .getByRole('heading', { name: /5 分钟自托管|5 minute self/i })
      .scrollIntoViewIfNeeded()
    const section = page.locator('section:has-text("Self-hosted")')
    await expect(section).toBeVisible()

    // InkBorderBeam 是卡片内第一个 absolute 子元素带 before conic-gradient
    const beam = section.locator('div[aria-hidden="true"].pointer-events-none').first()
    const beforeBg = await beam.evaluate((el) => getComputedStyle(el, '::before').backgroundImage)
    expect(beforeBg).toContain('conic-gradient')
  })

  test('三件事的序号 01/02/03 都渲染', async ({ page }) => {
    const features = page.locator('section:has(h2:has-text("三件事"))')
    // 需要把整个区域都拉进视口才能让第三张卡触发 useInView
    await features.scrollIntoViewIfNeeded()
    await expect(features).toBeVisible()

    const seals = features.locator('span[class*="rounded-sm"][class*="shadow-sm"]')
    await expect(seals).toHaveCount(3)

    // NumberTicker 用 spring 逐帧 tick 到目标值，轮询直到稳定
    await expect
      .poll(
        async () => seals.evaluateAll((els) => els.map((el) => (el.textContent ?? '').trim())),
        { timeout: 4000, intervals: [100, 200, 400, 800] },
      )
      .toEqual(['01', '02', '03'])
  })

  test('CLS 为 0（无布局偏移）', async ({ page }) => {
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let total = 0
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
            if (!e.hadRecentInput) total += e.value ?? 0
          }
        })
        po.observe({ type: 'layout-shift', buffered: true })
        setTimeout(() => {
          po.disconnect()
          resolve(total)
        }, 1200)
      })
    })
    // 允许极小容差（浏览器 subpixel 可能 < 0.01）
    expect(cls).toBeLessThan(0.05)
  })
})
