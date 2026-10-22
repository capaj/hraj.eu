import { test, expect } from './fixtures'

const pathname = process.env.SCREENSHOT_PATH

test('Capture a page', async ({ page, capture }) => {
  test.skip(
    !pathname,
    'Use pnpm screenshot /scenarios/<name> to select a page.'
  )
  await page.goto(pathname!)
  await expect(page.locator('main')).toBeVisible()
  const name =
    pathname!
      .split('?')[0]
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-|-$/g, '') || 'home'
  await capture(name)
})
