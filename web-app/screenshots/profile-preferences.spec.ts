import { test, expect } from './fixtures'

test('profile settings end with blocked players', async ({ page, capture }) => {
  await page.goto('/scenarios/profile-sports-preferences')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
  await expect(page.getByRole('heading', { name: 'Úrovně dovedností', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Zablokovaní hráči', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Odblokovat hráče Petr Novák', exact: true })).toBeVisible()
  await capture('profile-blocked-players-bottom')
})
