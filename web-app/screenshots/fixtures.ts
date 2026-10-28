import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { test as base, expect } from '@playwright/test'

export { expect }

export const test = base.extend<{
  capture: (name: string) => Promise<void>
}>({
  page: async ({ page, baseURL }, use) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.clock.setFixedTime(new Date('2026-10-22T17:30:00Z'))
    await page.context().route('**/*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      if (
        url.origin === baseURL &&
        url.pathname === '/api/auth/get-session' &&
        request.method() === 'GET'
      ) {
        await route.fulfill({ json: null })
        return
      }
      if (
        url.origin !== baseURL ||
        !['GET', 'HEAD'].includes(request.method()) ||
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/_serverFn/')
      ) {
        // Record only the path, never query parameters or request bodies.
        errors.push(
          `Unexpected service request: ${request.method()} ${url.pathname}`
        )
        await route.abort('blockedbyclient')
        return
      }
      await route.continue()
    })
    await use(page)
    expect(
      errors,
      'Screenshots must render without page errors or live services'
    ).toEqual([])
  },
  capture: async ({ page }, use, testInfo) => {
    await use(async (name) => {
      await expect(page.locator('html')).toHaveAttribute(
        'data-hydrated',
        'true'
      )
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all(
          Array.from(document.images)
            .filter((image) => image.currentSrc || image.src)
            .map((image) => {
              image.loading = 'eager'
              return image.decode()
            })
        )
      })
      await page.evaluate(() => window.scrollTo(0, 0))
      const directory = path.resolve(
        import.meta.dirname,
        '../artifacts/screenshots',
        testInfo.project.name
      )
      await mkdir(directory, { recursive: true })
      const screenshotPath = path.join(directory, `${name}.png`)
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        animations: 'disabled'
      })
      await testInfo.attach(name, {
        path: screenshotPath,
        contentType: 'image/png'
      })
    })
  }
})
