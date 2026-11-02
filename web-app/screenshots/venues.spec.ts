import { test, expect } from './fixtures'

test('Venue cards display available phone numbers as call links', async ({
  page,
  capture
}) => {
  // Keep the map offline while rendering the real venue cards.
  await page.route('https://*.tile.openstreetmap.org/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64'
      )
    })
  )
  await page.goto('/scenarios/venues')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')

  const cards = page.getByRole('article')
  await expect(cards).toHaveCount(6)
  for (const [name, phone] of [
    ['Beachklub Pankrác', '+420 777 123 456'],
    ['Sportovní areál Hagibor', '+420 222 345 678'],
    ['Sportovní hala Královka', '+420 233 456 789'],
    ['Beach Ládví', '+420 777 987 654']
  ]) {
    const card = cards.filter({ has: page.getByRole('heading', { name, exact: true }) })
    const link = card.getByRole('link', { name: phone, exact: true })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', `tel:${phone}`)
  }
  for (const name of ['Sportovní park Lužánky', 'Sportcentrum Cukrovar']) {
    const card = cards.filter({ has: page.getByRole('heading', { name, exact: true }) })
    await expect(card.locator('a[href^="tel:"]')).toHaveCount(0)
  }
  await capture('venue-card-phone', cards.first())
})
