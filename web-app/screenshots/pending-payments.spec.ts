import { test, expect } from './fixtures'

test('Pending bookings update the event card immediately and can see trust-payment QR images', async ({
  page,
  capture
}) => {
  await page.clock.setFixedTime(new Date())
  await page.goto('/scenarios/pending-payments')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  const qr = page.getByRole('img', { name: /QR/ })
  await expect(qr).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Připojit se ke hře', exact: true })
    .click()
  await expect(page.getByLabel('Join requests', { exact: true })).toHaveText(
    '1'
  )
  const payment = page.getByRole('link', {
    name: 'Zaplatit a potvrdit účast',
    exact: true
  })
  await expect(payment).toHaveAttribute(
    'href',
    '/events/pending-payment-preview'
  )
  await expect(
    page.getByRole('button', { name: 'Připojit se ke hře', exact: true })
  ).toHaveCount(0)
  await expect(qr).toBeVisible()
  await expect(
    page.getByText('Jste přihlášen(a)', { exact: true })
  ).toHaveCount(0)
  await capture('pending-trust-payment')
  await qr.click()
  await expect(
    page.getByLabel('Selected QR image', { exact: true })
  ).toHaveText('/scenarios/trust-payment.svg')
  await expect(page.getByLabel('Join requests', { exact: true })).toHaveText(
    '1'
  )

  await page.getByLabel('Current viewer', { exact: true }).selectOption('petr')
  await expect(qr).toHaveCount(0)
  await page.getByLabel('Current viewer', { exact: true }).selectOption('')
  await expect(qr).toHaveCount(0)
  await page.getByLabel('Current viewer', { exact: true }).selectOption('anna')
  await expect(qr).toBeVisible()
  await page.getByLabel('Use Fio verification', { exact: true }).check()
  await expect(qr).toHaveCount(0)
})

test('Pending map popups link to payment rather than joining again', async ({
  page,
  capture
}) => {
  // Leaflet's popup panning needs Date.now to advance with its animation.
  await page.clock.setSystemTime(new Date())
  await page.context().setGeolocation({ latitude: 50.0755, longitude: 14.4378 })
  await page.context().grantPermissions(['geolocation'])
  await page.route('https://*.tile.openstreetmap.org/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><path fill="#e8f0e9" d="M0 0h256v256H0z"/><path stroke="#d5ded6" fill="none" d="M0 64h256M0 128h256M0 192h256M64 0v256M128 0v256M192 0v256"/></svg>'
    })
  )
  await page.goto('/scenarios/event-map')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  await page.getByRole('button', { name: /^Payment pending:/ }).click()
  const popup = page.locator('.leaflet-popup')
  await expect(popup).toBeInViewport({ ratio: 1 })
  await expect(
    popup.getByRole('link', { name: 'Zaplatit a potvrdit účast', exact: true })
  ).toHaveAttribute('href', '/events/pending-payment')
  await expect(
    popup.getByRole('button', { name: 'Připojit se ke hře', exact: true })
  ).toHaveCount(0)
  await capture('pending-payment-map', page.getByTestId('event-map-preview'))
})
