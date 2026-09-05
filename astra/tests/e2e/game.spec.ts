import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function start(page: Page, mobile: boolean) {
  await page.goto('/')
  await page.getByRole('button', { name: mobile ? '바로 대국 시작' : '대국 시작', exact: true }).click()
}

async function point(page: Page, position: string, mobile: boolean, force = false) {
  const target = page.locator(`[data-position="${position}"]`)
  if (mobile) await target.tap({ force })
  else await target.click({ force })
}

test('renders a complete board and previews all arrangements without overflow', async ({ page }, info) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-piece-id]')).toHaveCount(32)
  await expect(page.getByRole('gridcell')).toHaveCount(90)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const board = await page.getByRole('grid', { name: '장기판' }).boundingBox()
  expect(board?.width).toBeGreaterThan(300)
  expect(board!.x).toBeGreaterThanOrEqual(0)
  expect(board!.x + board!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({ path: `test-results/${info.project.name}-setup.png`, fullPage: true })
  await page.getByRole('radio', { name: '초 상마상마', exact: true }).check()
  await expect(page.locator('[data-position="2,10"]')).toHaveAttribute('aria-label', '초 상, 10행 2열')
  await page.getByRole('radio', { name: '한 마상상마', exact: true }).check()
  await expect(page.locator('[data-position="8,1"]')).toHaveAttribute('aria-label', '한 마, 1행 8열')
})

test('plays by click or touch, captures by drag, undoes, replays and resigns', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile'
  await start(page, mobile)
  await point(page, '1,7', mobile)
  await expect(page.locator('.move-target')).toHaveCount(2)
  await point(page, '1,6', mobile)
  await expect(page.locator('[data-position="1,6"]')).toHaveAttribute('aria-label', '초 졸, 6행 1열')
  await point(page, '1,4', mobile)
  await point(page, '1,5', mobile)
  await page.locator('[data-position="1,6"]').scrollIntoViewIfNeeded()
  const origin = (await page.locator('[data-position="1,6"]').boundingBox())!
  const target = (await page.locator('[data-position="1,5"]').boundingBox())!
  if (mobile) {
    const client = await page.context().newCDPSession(page)
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: origin.x + origin.width / 2, y: origin.y + origin.height / 2 }] })
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: target.x + target.width / 2, y: target.y + target.height / 2 }] })
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await client.detach()
  } else {
    await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2)
    await page.mouse.down()
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 5 })
    await page.mouse.up()
  }
  await expect(page.locator('[data-position="1,5"]')).toHaveAttribute('aria-label', '초 졸, 5행 1열')
  await expect(page.locator('[data-piece-id]')).toHaveCount(31)
  await expect(page.getByRole('region', { name: '한 진영', exact: true }).locator('.player-score')).toContainText('71.5')
  await page.getByRole('button', { name: '한 수 무르기', exact: true }).click()
  await expect(page.locator('[data-piece-id]')).toHaveCount(32)
  await page.getByRole('button', { name: '한 수 쉬기', exact: true }).click()
  await expect(page.locator('.move-entry')).toHaveCount(3)
  await page.getByRole('button', { name: '처음 수로', exact: true }).click()
  await expect(page.getByRole('button', { name: '한 수 쉬기', exact: true })).toBeDisabled()
  await expect(page.locator('[data-position="1,7"]')).toHaveAttribute('aria-label', '초 졸, 7행 1열')
  await expect(page.getByRole('grid', { name: '장기판' })).toHaveAttribute('aria-disabled', 'true')
  await point(page, '1,7', mobile, true)
  await point(page, '1,6', mobile, true)
  await expect(page.locator('.move-entry')).toHaveCount(3)
  await page.getByRole('button', { name: '대국으로 돌아가기', exact: true }).click()
  await page.getByRole('grid', { name: '장기판' }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/${info.project.name}-playing.png`, fullPage: true })
  await page.getByRole('button', { name: '기권', exact: true }).click()
  await page.getByRole('button', { name: '기권 확정', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '대국 종료' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '초 진영 승리' })).toBeVisible()
})

test('supports keyboard moves, display preferences and an agreed score result', async ({ page }, info) => {
  await start(page, info.project.name === 'mobile')
  await page.locator('[data-position="5,7"]').focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-position="5,6"]')).toHaveAttribute('aria-label', '초 졸, 6행 5열')
  await page.getByRole('button', { name: '장기판 뒤집기', exact: true }).click()
  await expect(page.getByRole('button', { name: '장기판 뒤집기', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '화면 설정', exact: true }).click()
  await page.getByRole('radio', { name: '한 한글', exact: true }).check()
  await page.getByRole('checkbox', { name: '색각 보조 팔레트' }).check()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.app-shell')).toHaveClass(/palette-accessible/)
  await expect(page.locator('[data-piece-id="CHO-GUNG-5-9"] .piece-character')).toHaveText('궁')
  await page.getByRole('button', { name: '무승부 제안', exact: true }).click()
  await page.getByRole('button', { name: '수락 · 점수 판정', exact: true }).click()
  await expect(page.getByRole('heading', { name: '한 진영 승리' })).toBeVisible()
  await expect(page.getByRole('dialog')).toContainText('합의 종료 · 점수승')
})