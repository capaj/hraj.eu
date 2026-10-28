import { test, expect } from './fixtures'

test('Create event offers exactly three payment modes and disables Fio without a saved token', async ({
  page,
  capture
}) => {
  // The real form's native date minimum is rendered with the server's current date.
  await page.clock.setFixedTime(new Date())
  await page.goto('/scenarios/event-payment-modes')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  const settings = page.getByTestId('event-payment-settings')
  await expect(settings.getByRole('radio')).toHaveCount(3)
  const optional = settings.getByRole('radio', { name: /^Bez placení předem/ })
  const trust = settings.getByRole('radio', {
    name: /^Platba předem na dobré slovo/
  })
  const fio = settings.getByRole('radio', {
    name: /^Platba předem ověřená Fio bankou/
  })
  await expect(optional).toBeChecked()
  await expect(fio).toBeEnabled()
  await expect(page.locator('#fio-token')).toHaveCount(0)
  await capture('event-payment-modes', settings)
  const submit = page.getByRole('main').getByRole('button', {
    name: 'Vytvořit událost',
    exact: true
  })
  const output = page.getByLabel('Submitted payment settings', { exact: true })
  await submit.click()
  await expect(output).toHaveText('manual:false')

  await page.getByLabel('Saved Fio token', { exact: true }).uncheck()
  await expect(fio).toBeDisabled()
  await expect(optional).toBeEnabled()
  await expect(trust).toBeEnabled()
  await capture('event-payment-modes-no-token', settings)
  await trust.check()
  await submit.click()
  await expect(output).toHaveText('manual:true')

  await page.getByLabel('Saved Fio token', { exact: true }).check()
  await fio.check()
  await expect(fio).toBeChecked()
  await capture('event-payment-modes-fio', settings)
  await submit.click()
  await expect(output).toHaveText('fio:true')
})
