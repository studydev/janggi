import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { createInitialState } from '../../src/engine/board'
import { exportGame, importGame } from '../../src/engine/game-record'
import { pass } from '../../src/engine/rules'

test('preserves the saved record across a rendering failure and recovery', async ({ page }) => {
  const saved = exportGame(pass(createInitialState()), { hanSetup: 'MSMS', choSetup: 'MSMS' })
  await page.addInitScript((record) => localStorage.setItem('astra:match:v1', record), saved)
  await page.route('**/src/App.tsx*', (route) => route.fulfill({ contentType: 'application/javascript', body: 'export default function App() { throw new Error("intentional render failure") }' }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '대국 화면에 오류가 발생했습니다' })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '기보 백업 받기' }).click()
  const download = await downloadPromise
  const backup = await readFile((await download.path())!, 'utf8')
  expect(importGame(backup).game.moveHistory).toHaveLength(1)
  await page.unroute('**/src/App.tsx*')
  await page.getByRole('button', { name: '화면 다시 불러오기' }).click()
  await expect(page.getByRole('dialog', { name: '이전 대국을 이어둘까요?' })).toBeVisible()
  await page.getByRole('button', { name: '이어서 두기' }).click()
  await expect(page.locator('.move-entry')).toHaveCount(1)
})