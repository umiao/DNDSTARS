import { expect, test } from '@playwright/test'

test('DM and player ports load', async ({ browser }) => {
  const context = await browser.newContext()
  const dm = await context.newPage()
  const player = await context.newPage()

  await Promise.all([
    dm.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' }),
    player.goto('http://127.0.0.1:5174', { waitUntil: 'domcontentloaded' }),
  ])

  await expect(dm.locator('body')).toBeVisible()
  await expect(player.locator('body')).toBeVisible()

  await expect
    .poll(async () => (await dm.locator('body').innerText()).trim().length)
    .toBeGreaterThan(0)
  await expect
    .poll(async () => (await player.locator('body').innerText()).trim().length)
    .toBeGreaterThan(0)

  await context.close()
})
