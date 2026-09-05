import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const directory = fileURLToPath(new URL('../public/icons/', import.meta.url))
await mkdir(directory, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ locale: 'ko-KR' })
  for (const size of [180, 192, 512]) {
    const image = await page.evaluate((size) => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      context.fillStyle = '#244d3b'
      context.fillRect(0, 0, size, size)
      context.fillStyle = '#f6f7f4'
      context.beginPath()
      context.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#244d3b'
      context.font = `600 ${size * 0.48}px serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('楚', size / 2, size * 0.53)
      return canvas.toDataURL('image/png').split(',')[1]
    }, size)
    const png = Buffer.from(image, 'base64')
    assert.equal(png.readUInt32BE(16), size)
    assert.equal(png.readUInt32BE(20), size)
    await writeFile(`${directory}/icon-${size}.png`, png)
    console.log(`Generated icon-${size}.png (${png.length} bytes)`)
  }
} finally {
  await browser.close()
}