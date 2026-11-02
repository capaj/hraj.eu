import { test, expect } from './fixtures'

test('Venue details render full information, historical events, pagination and empty states', async ({
  page,
  capture
}) => {
  await page.route('https://*.tile.openstreetmap.org/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64'
      )
    })
  )
  await page.goto('/scenarios/venue-details')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  await expect(
    page.getByRole('heading', { name: 'Beachklub Pankrác', exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: '+420 777 123 456', exact: true })
  ).toHaveAttribute('href', 'tel:+420 777 123 456')
  await expect(
    page.getByRole('link', { name: 'recepce@example.test', exact: true })
  ).toHaveAttribute('href', 'mailto:recepce@example.test')
  await expect(
    page.getByRole('link', { name: 'https://example.test', exact: true })
  ).toHaveAttribute('href', 'https://example.test/')
  await expect(
    page.getByRole('heading', { name: 'Otevírací doba', exact: true })
  ).toBeVisible()
  await expect(page.getByText('Zavřeno', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Vstup do areálu je z Horáčkovy ulice.', { exact: false })
  ).toBeVisible()
  await expect(
    page
      .getByRole('region', { name: 'Fotografie sportoviště' })
      .getByRole('img')
  ).toHaveCount(1)
  await expect(
    page.getByRole('img', { name: 'Orientační plán', exact: true })
  ).toBeVisible()
  const history = page.locator('#event-history')
  await expect(history.getByRole('listitem')).toHaveCount(20)
  await expect(history.getByText('Zrušeno', { exact: true })).toBeVisible()
  await expect(
    history.getByRole('link', {
      name: 'Podvečerní beach volejbal',
      exact: true
    })
  ).toHaveAttribute('href', '/events/historical-event-0')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await capture('venue-details')

  await history.getByRole('link', { name: 'Další', exact: true }).click()
  await expect(history.getByRole('listitem')).toHaveCount(3)
  await expect(history.getByText('Strana 2 z 2', { exact: true })).toBeVisible()
  await expect(
    history.getByRole('link', { name: 'Další', exact: true })
  ).toHaveCount(0)
  await capture('venue-history-older', history)
  await history.getByRole('link', { name: 'Předchozí', exact: true }).click()
  await expect(history.getByRole('listitem')).toHaveCount(20)

  await page.getByRole('checkbox', { name: 'Empty venue preview' }).check()
  await expect(
    history.getByText('Zatím žádné minulé události.', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText('Kontaktní údaje nejsou k dispozici.', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText('Cena není uvedena', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText('Popis není k dispozici.', { exact: true })
  ).toBeVisible()
  await capture('venue-details-empty')
})
