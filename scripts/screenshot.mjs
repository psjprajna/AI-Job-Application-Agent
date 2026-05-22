import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const baseUrl = process.env.URL ?? 'http://localhost:3000'
const outDir = 'public'

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const shots = [
  { name: 'og-image.png', path: '/', width: 1280, height: 640 },
  { name: 'hero.png', path: '/', width: 1920, height: 1080 },
  { name: 'demo.png', path: '/demo', width: 1600, height: 1400, fullPage: true },
]

for (const shot of shots) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  await page.goto(`${baseUrl}${shot.path}`, { waitUntil: 'networkidle' })
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast], #__next-build-watcher,
      #__next-prerender-indicator, [data-nextjs-dev-tools-button] {
        display: none !important;
      }
    `,
  })
  await page.waitForTimeout(400)
  const out = `${outDir}/${shot.name}`
  await page.screenshot({ path: out, fullPage: Boolean(shot.fullPage) })
  console.log(`wrote ${out} (${shot.width}x${shot.height} @2x${shot.fullPage ? ' fullPage' : ''})`)
  await context.close()
}

await browser.close()
