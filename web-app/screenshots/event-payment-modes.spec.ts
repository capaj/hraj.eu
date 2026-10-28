import { test, expect } from './fixtures'

test('Payment mode summary opens a modal; save applies the choice and cancel discards it', async ({
  page,
  capture
}) => {
  // The real form's native date minimum is rendered with the server's current date.
  await page.clock.setFixedTime(new Date())
  await page.goto('/scenarios/event-payment-modes')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  const settings = page.getByTestId('event-payment-settings')
  const change = settings.getByRole('button', { name: 'Změnit', exact: true })
  const dialog = page.getByRole('dialog', {
    name: 'Změnit režim placení',
    exact: true
  })
  const optional = dialog.getByRole('radio', { name: /^Bez placení předem/ })
  const trust = dialog.getByRole('radio', {
    name: /^Platba předem na dobré slovo/
  })
  const fio = dialog.getByRole('radio', {
    name: /^Platba předem ověřená Fio bankou/
  })
  const save = dialog.getByRole('button', { name: 'Uložit', exact: true })
  const output = page.getByLabel('Submitted payment settings', { exact: true })
  const submit = page
    .getByRole('main')
    .getByRole('button', { name: 'Vytvořit událost', exact: true })

  await expect(settings).toContainText('Bez placení předem')
  await expect(settings.getByRole('radio')).toHaveCount(0)
  await expect(dialog).toHaveCount(0)
  await capture('event-payment-modes', settings)
  await submit.click()
  await expect(output).toHaveText('manual:false')

  await change.click()
  await expect(dialog.getByRole('radio')).toHaveCount(3)
  await expect(optional).toBeChecked()
  await expect(fio).toBeEnabled()
  await expect(page.locator('#fio-token')).toHaveCount(0)
  await capture('event-payment-mode-dialog', dialog)
  await trust.check()
  await dialog.getByRole('button', { name: 'Zrušit', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(settings).toContainText('Bez placení předem')
  await expect(change).toBeFocused()

  await change.click()
  await expect(optional).toBeChecked()
  await trust.check()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(change).toBeFocused()
  await change.click()
  await expect(optional).toBeChecked()
  await trust.check()
  await save.click()
  await expect(settings).toContainText('Platba předem na dobré slovo')
  await expect(dialog).toHaveCount(0)
  // Saving the modal must not submit the surrounding event form.
  await expect(output).toHaveText('manual:false')
  await submit.click()
  await expect(output).toHaveText('manual:true')

  await page.getByLabel('Saved Fio token', { exact: true }).uncheck()
  await change.click()
  await expect(fio).toBeDisabled()
  await expect(optional).toBeEnabled()
  await expect(trust).toBeEnabled()
  await capture('event-payment-modes-no-token', dialog)
  await trust.check()
  await save.click()
  await expect(output).toHaveText('')
  await submit.click()
  await expect(output).toHaveText('manual:true')

  await page.getByLabel('Saved Fio token', { exact: true }).check()
  await change.click()
  await fio.check()
  await expect(fio).toBeChecked()
  await save.click()
  await expect(settings).toContainText('Platba předem ověřená Fio bankou')
  await expect(settings.getByRole('radio')).toHaveCount(0)
  await capture('event-payment-modes-fio', settings)
  await submit.click()
  await expect(output).toHaveText('fio:true')

  await page.getByLabel('Payment settings locked', { exact: true }).check()
  await expect(change).toBeDisabled()
  await expect(dialog).toHaveCount(0)
})
