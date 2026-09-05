import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('passes WCAG checks during setup and play and traps dialog focus', async ({ page }, info) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const setup = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(setup.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) }))).toEqual([])
  await page.getByRole('button', { name: info.project.name === 'mobile' ? '바로 대국 시작' : '대국 시작', exact: true }).click()
  const playing = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(playing.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) }))).toEqual([])
  await page.getByRole('button', { name: '화면 설정', exact: true }).click()
  for (let count = 0; count < 12; count += 1) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '화면 설정', exact: true })).toBeFocused()
})

test('keeps mobile match controls beside the board and touch targets at least 44px', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile')
  await page.goto('/')
  await page.getByRole('button', { name: '바로 대국 시작', exact: true }).click()
  const pass = await page.getByRole('button', { name: '한 수 쉬기', exact: true }).boundingBox()
  expect(pass!.y + pass!.height).toBeLessThan(page.viewportSize()!.height)
  const smallTargets = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, select')).filter((element) => {
      const box = element.getBoundingClientRect()
      return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44)
    }).map((element) => element.getAttribute('aria-label') || element.textContent)
  })
  expect(smallTargets).toEqual([])
  const boardTargets = await page.locator('.point-hit').evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width))
  expect(Math.min(...boardTargets)).toBeGreaterThanOrEqual(43.9)
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await page.locator('.board-piece').first().evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0s')
})