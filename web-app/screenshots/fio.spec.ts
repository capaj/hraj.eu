import { test, expect } from './fixtures'

test('Fio event: saved account, QR payment, and confirmation', async ({
  page,
  capture
}) => {
  await page.goto('/scenarios/fio-payments')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  await expect(
    page.getByRole('heading', { name: 'Čtvrteční fotbal v Letňanech' })
  ).toBeVisible()
  await expect(page.locator('#fio-token')).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: /^Zaplatil/ })).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Spravovat propojení s Fio' })
  ).toHaveAttribute('href', '/user-profile')
  await expect(page.getByRole('img', { name: 'QR platba' })).toBeVisible()
  await expect(
    page.getByText('Čekáme na platbu — místo máte rezervované', { exact: true })
  ).toBeVisible()
  await capture('fio-payments-pending')

  await page.getByRole('button', { name: 'Simulate Anna’s payment' }).click()
  await expect(
    page.getByText('Jste přihlášen(a)', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('row').filter({ hasText: 'Anna Dvořáková' })
  ).toContainText('Potvrzeno')
  await expect(page.getByRole('img', { name: 'QR platba' })).toHaveCount(0)
  await expect(page.locator('#fio-token')).toHaveCount(0)
  await capture('fio-payments-paid')
})

test('Trusted advance payment: player checkbox immediately confirms attendance', async ({
  page,
  capture
}) => {
  await page.goto('/scenarios/fio-payments')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  await page
    .getByRole('radio', { name: /^Platba předem na dobré slovo/ })
    .check()
  await expect(page.getByRole('img', { name: 'QR platba' })).toHaveCount(0)
  await expect(page.locator('#fio-token')).toHaveCount(0)
  const anna = page.getByRole('row').filter({ hasText: 'Anna Dvořáková' })
  await expect(anna).toContainText('Čeká na platbu')
  await capture('fio-payments-manual')

  const paid = page.getByRole('checkbox', { name: /^Zaplatil/ })
  await expect(paid).not.toBeChecked()
  await paid.check()
  await expect(anna).toContainText('Potvrzeno')
  await expect(
    page.getByText('Jste přihlášen(a)', { exact: true })
  ).toBeVisible()
  await capture('payment-on-trust-confirmed')
  await paid.uncheck()
  await expect(anna).toContainText('Čeká na platbu')
  await expect(
    page.getByText('Jste přihlášen(a)', { exact: true })
  ).toHaveCount(0)
})

test('No advance payment: attendance is confirmed before declaring payment', async ({
  page,
  capture
}) => {
  await page.goto('/scenarios/fio-payments')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  await page.getByRole('radio', { name: /^Bez placení předem/ }).check()
  await expect(
    page.getByText('Jste přihlášen(a)', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('row').filter({ hasText: 'Anna Dvořáková' })
  ).toContainText('Potvrzeno')
  await capture('no-advance-payment-confirmed')
})

test('Fio profile: one saved connection and explicit token replacement', async ({
  page,
  capture
}) => {
  await page.goto('/scenarios/fio-profile')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  await expect(page.getByText('Účet propojen', { exact: true })).toBeVisible()
  const token = page.getByLabel('API token pouze pro čtení', { exact: true })
  await expect(token).toHaveCount(0)
  await capture('fio-profile-connected')

  await page
    .getByRole('button', { name: 'Nahradit token', exact: true })
    .click()
  await expect(token).toBeVisible()
  await expect(token).toHaveAttribute('type', 'password')
  await capture('fio-profile-replace-token')

  await page.getByRole('button', { name: 'Zrušit', exact: true }).click()
  await expect(token).toHaveCount(0)
  await page.getByRole('button', { name: 'Odpojit', exact: true }).click()
  await expect(token).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Propojit účet Fio', exact: true })
  ).toBeDisabled()
  await capture('fio-profile-setup')
})
