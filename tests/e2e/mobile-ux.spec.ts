import { expect, test } from '@playwright/test'

test.describe('Mobile UX affordances', () => {
  test.skip(() => true, '需要登录态 fixture 后再启用。断言代码已就绪。')

  test.use({ viewport: { width: 375, height: 812 } })

  test('mobile navigation stays visible and compact', async ({ page }) => {
    await page.goto('/zh-CN/workspace')

    const mobileNav = page.getByRole('navigation', { name: '移动端主导航' })
    await expect(mobileNav).toBeVisible()
    await expect(page.getByRole('navigation', { name: '主导航' })).toBeHidden()
    await expect(mobileNav.getByRole('link', { name: /工作台/ })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: /设置/ })).toBeVisible()
  })

  test('first idea can be captured inline from empty inbox', async ({ page }) => {
    await page.goto('/zh-CN/inbox')
    await expect(page.getByPlaceholder(/脑子里的东西|Drop whatever/)).toBeVisible()
  })
})
