import { expect, test, type Page } from '@playwright/test'

/**
 * Command Palette · cmdk 集成回归
 *
 * 覆盖 C 阶段改造：
 * - ⌘K / Ctrl+K 唤起面板
 * - 分组（想法 / 操作 / 跳转）渲染正确
 * - cmdk 内置 fuzzy 搜索生效
 * - 主题子视图切换
 * - Esc 关闭
 *
 * 注意：CommandPalette 挂在 (app)/layout，需登录态。
 * 在未登录的 landing 页上 palette 不挂载，所以这组测试走登录后的 workspace 页。
 * 当前没有登录 fixture，因此这些用例用 `test.skip()` 或 `test.fixme()` 标记，
 * 保留断言代码以便未来加上 auth fixture 立即跑通。
 */
async function openPalette(page: Page) {
  await page.keyboard.press('ControlOrMeta+k')
  await page.waitForSelector('[role="dialog"]', { state: 'visible' })
}

test.describe('Command Palette', () => {
  // 跳过整组（因为需要登录态，具体见文件顶部说明）
  test.skip(() => true, '需要登录态 fixture 后再启用。断言代码已就绪。')

  test.beforeEach(async ({ page }) => {
    await page.goto('/zh-CN/workspace')
  })

  test('⌘K 唤起面板，展示三大分组', async ({ page }) => {
    await openPalette(page)

    await expect(page.getByText('想法', { exact: true })).toBeVisible()
    await expect(page.getByText('操作', { exact: true })).toBeVisible()
    await expect(page.getByText('跳转', { exact: true })).toBeVisible()

    // 跳转分组里必须有 8 个固定路由 item
    for (const label of [
      '工作台',
      '收件箱',
      '今日聚焦',
      '笔记',
      '复盘',
      '记忆',
      '知识图谱',
      '设置',
    ]) {
      await expect(page.getByRole('option', { name: new RegExp(label) })).toBeVisible()
    }
  })

  test('cmdk 过滤：输入"设置"只剩跳转条目', async ({ page }) => {
    await openPalette(page)
    const input = page.getByPlaceholder(/搜索想法|Search/i)
    await input.fill('设置')

    const visibleOptions = page.locator('[cmdk-item]:not([aria-disabled="true"])')
    // 输入"设置"后 cmdk 应只留几条命中
    await expect(visibleOptions).toHaveCount(1)
    await expect(visibleOptions.first()).toContainText('设置')
  })

  test('切换主题子视图 + 返回', async ({ page }) => {
    await openPalette(page)

    await page.getByRole('option', { name: /切换主题/ }).click()

    await expect(page.getByText(/选择主题/)).toBeVisible()
    await expect(page.getByPlaceholder(/搜索主题|Search themes/i)).toBeVisible()
    // 至少有 2 个主题 option
    const themeOpts = page.locator('[cmdk-item]')
    expect(await themeOpts.count()).toBeGreaterThanOrEqual(2)

    await page.getByRole('button', { name: /返回|Back/ }).click()
    await expect(page.getByText('跳转', { exact: true })).toBeVisible()
  })

  test('Esc 关闭面板', async ({ page }) => {
    await openPalette(page)
    await page.keyboard.press('Escape')
    await page.waitForSelector('[role="dialog"]', { state: 'detached' })
  })
})
