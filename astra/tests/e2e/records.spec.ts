import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { importGame } from '../../src/engine/game-record'

test('exports, validates imports and asks before restoring an autosave', async ({ page }, info) => {
  await page.goto('/')
  await page.getByRole('button', { name: info.project.name === 'mobile' ? '바로 대국 시작' : '대국 시작', exact: true }).click()
  await page.locator('[data-position="5,7"]').focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('Enter')
  await expect(page.locator('.move-entry')).toHaveCount(1)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '기보 JSON 내보내기' }).click()
  const downloaded = await downloadPromise
  const content = await readFile((await downloaded.path())!, 'utf8')
  expect(importGame(content).game.moveHistory).toHaveLength(1)

  const beforeReload = await page.evaluate(() => localStorage.getItem('astra:match:v1'))
  await page.reload()
  await expect(page.getByRole('dialog', { name: '이전 대국을 이어둘까요?' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('astra:match:v1'))).toBe(beforeReload)
  await page.getByRole('button', { name: '이어서 두기', exact: true }).click()
  await expect(page.locator('[data-position="5,6"]')).toHaveAttribute('aria-label', '초 졸, 6행 5열')
  await expect(page.locator('.move-entry')).toHaveCount(1)

  await page.getByLabel('기보 파일 선택').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') })
  await expect(page.getByRole('alert')).toContainText('기보 형식 또는 착수가 올바르지 않습니다.')
  await expect(page.locator('.move-entry')).toHaveCount(1)
  await page.getByRole('button', { name: '한 수 쉬기', exact: true }).click()
  await expect(page.locator('.move-entry')).toHaveCount(2)
  await page.getByLabel('기보 파일 선택').setInputFiles({ name: 'astra.json', mimeType: 'application/json', buffer: Buffer.from(content) })
  await expect(page.getByRole('dialog', { name: '기보를 불러올까요?' })).toContainText('현재 대국이 이 기보로 교체됩니다.')
  await page.getByRole('button', { name: '기보 불러오기', exact: true }).click()
  await expect(page.locator('.move-entry')).toHaveCount(1)
})

test('retains a corrupt save until the player explicitly starts over', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('astra:match:v1', '{bad json')
    localStorage.setItem('unrelated-game', 'keep')
  })
  await page.goto('/')
  await expect(page.getByRole('dialog', { name: '저장된 대국을 복구할 수 없습니다' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('astra:match:v1'))).toBe('{bad json')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '원본 백업 받기' }).click()
  const download = await downloadPromise
  expect(await readFile((await download.path())!, 'utf8')).toBe('{bad json')
  await page.getByRole('button', { name: '새로 시작', exact: true }).click()
  expect(await page.evaluate(() => localStorage.getItem('astra:match:v1'))).toBe(null)
  expect(await page.evaluate(() => localStorage.getItem('unrelated-game'))).toBe('keep')
})

test('remains playable when automatic storage is denied', async ({ page }, info) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Denied', 'QuotaExceededError') }
  })
  await page.goto('/')
  await page.getByRole('button', { name: info.project.name === 'mobile' ? '바로 대국 시작' : '대국 시작', exact: true }).click()
  await page.getByRole('button', { name: '한 수 쉬기', exact: true }).click()
  await expect(page.locator('.move-entry')).toHaveCount(1)
  await expect(page.getByRole('alert')).toContainText('자동 저장을 사용할 수 없습니다.')
})