import { readFile } from 'node:fs/promises'
import { test, expect } from './fixtures'

const png = await readFile(
  new URL('../public/brand/hraj-social.png', import.meta.url)
)
const pitch = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
<rect width="640" height="360" rx="18" fill="#eaf4ee"/>
<text x="32" y="43" fill="#174b35" font-family="sans-serif" font-size="22" font-weight="bold">Sportovní areál Letňany</text>
<rect x="72" y="72" width="496" height="230" rx="4" fill="#3a8b57"/>
<g fill="none" stroke="#fff" stroke-width="3"><rect x="88" y="88" width="464" height="198"/><path d="M320 88V286"/><circle cx="320" cy="187" r="38"/><path d="M88 133H145V241H88M552 133H495V241H552"/></g>
<path d="M32 320H78V270" fill="none" stroke="#e47930" stroke-width="7"/>
<circle cx="78" cy="270" r="10" fill="#e47930"/>
<text x="94" y="335" fill="#174b35" font-family="sans-serif" font-size="18">Brána A · sraz v 18:20</text></svg>`

test.beforeEach(async ({ page }) => {
  await page.route('https://uploads.hraj.eu/event-comments/**', (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: pitch })
  )
  await page.goto('/scenarios/event-comment-images')
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true')
})

test('file dialog, drag and drop, clipboard, removal, posting and editing', async ({
  page,
  capture
}) => {
  const editor = page.getByRole('textbox', { name: 'Zanechte komentář' })
  await editor.fill('Tady je plánek. Sejdeme se u brány A!')
  const chooserPromise = page.waitForEvent('filechooser')
  await page
    .getByRole('button', { name: 'Přidat obrázky', exact: true })
    .click()
  await (
    await chooserPromise
  ).setFiles({ name: 'pitch.png', mimeType: 'image/png', buffer: png })
  await expect(
    page.getByRole('img', { name: 'Přiložený obrázek 1', exact: true })
  ).toBeVisible()

  await editor.evaluate(
    (element, bytes) => {
      const data = new DataTransfer()
      data.items.add(
        new File([new Uint8Array(bytes)], 'dropped.png', { type: 'image/png' })
      )
      element.dispatchEvent(
        new DragEvent('drop', {
          dataTransfer: data,
          bubbles: true,
          cancelable: true
        })
      )
    },
    [...png]
  )
  await expect(
    page.getByRole('img', { name: 'Přiložený obrázek 2', exact: true })
  ).toBeVisible()

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.evaluate(
    async (bytes) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': new Blob([new Uint8Array(bytes)], { type: 'image/png' })
        })
      ])
    },
    [...png]
  )
  await editor.focus()
  await editor.press('Control+v')
  await expect(
    page.getByRole('img', { name: 'Přiložený obrázek 3', exact: true })
  ).toBeVisible()
  await expect(page.getByTestId('upload-count')).toHaveText('Uploads: 3')
  await expect(editor).toHaveValue('Tady je plánek. Sejdeme se u brány A!')
  await page.evaluate(() => navigator.clipboard.writeText(' Ahoj!'))
  await editor.press('End')
  await editor.press('Control+v')
  await expect(editor).toHaveValue(
    'Tady je plánek. Sejdeme se u brány A! Ahoj!'
  )
  await expect(page.getByTestId('upload-count')).toHaveText('Uploads: 3')
  await editor.fill('Tady je plánek. Sejdeme se u brány A!')

  await page
    .getByRole('button', { name: 'Odebrat obrázek 3', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Odebrat obrázek 2', exact: true })
    .click()
  await capture('event-comment-picture-draft')
  await page
    .getByRole('button', { name: 'Odeslat komentář', exact: true })
    .click()
  await expect(editor).toHaveValue('')
  await expect(
    page.getByRole('img', { name: 'Obrázek v komentáři', exact: true })
  ).toBeVisible()
  await expect(
    page.getByText('Tady je plánek. Sejdeme se u brány A!', { exact: true })
  ).toBeVisible()
  await capture('event-comment-picture-posted')

  await page
    .getByRole('button', { name: 'Upravit', exact: true })
    .last()
    .click()
  const edit = page.getByRole('textbox', {
    name: 'Upravit komentář',
    exact: true
  })
  await expect(
    page.getByRole('img', { name: 'Přiložený obrázek 1', exact: true })
  ).toBeVisible()
  await edit.fill('Aktualizovaný plánek')
  await page.evaluate(
    async (bytes) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': new Blob([new Uint8Array(bytes)], { type: 'image/png' })
        })
      ])
    },
    [...png]
  )
  await edit.press('Control+v')
  await expect(
    page.getByRole('img', { name: 'Přiložený obrázek 2', exact: true })
  ).toBeVisible()
  await page.getByRole('button', { name: 'Uložit', exact: true }).click()
  await expect(
    page.getByRole('img', { name: 'Obrázek v komentáři', exact: true })
  ).toHaveCount(2)
  await expect(
    page.getByText('Aktualizovaný plánek', { exact: true })
  ).toBeVisible()
})

test('validation and upload failures preserve the draft; picture-only comments work', async ({
  page
}) => {
  const editor = page.getByRole('textbox', { name: 'Zanechte komentář' })
  const files = page.getByLabel('Vybrat obrázky', { exact: true })
  await editor.fill('Rozepsaný komentář')
  await files.setInputFiles({
    name: 'bad.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg/>')
  })
  await expect(page.getByRole('alert')).toContainText(
    'JPEG, PNG, WebP nebo GIF'
  )
  await files.setInputFiles(
    Array.from({ length: 5 }, () => ({
      name: 'pitch.png',
      mimeType: 'image/png',
      buffer: png
    }))
  )
  await expect(page.getByRole('alert')).toContainText('nejvýše 4 obrázky')
  await expect(page.getByTestId('upload-count')).toHaveText('Uploads: 0')
  await page.getByLabel('Simulate upload failure').check()
  await files.setInputFiles({
    name: 'pitch.png',
    mimeType: 'image/png',
    buffer: png
  })
  await expect(
    page.getByRole('button', { name: 'Odeslat komentář', exact: true })
  ).toBeDisabled()
  await expect(page.getByRole('alert')).toContainText('nepodařilo nahrát')
  await expect(editor).toHaveValue('Rozepsaný komentář')
  await page.getByLabel('Simulate upload failure').uncheck()
  await editor.fill('')
  await files.setInputFiles({
    name: 'pitch.png',
    mimeType: 'image/png',
    buffer: png
  })
  await expect(
    page.getByRole('img', { name: 'Přiložený obrázek 1', exact: true })
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Odeslat komentář', exact: true })
    .click()
  await expect(
    page.getByRole('img', { name: 'Obrázek v komentáři', exact: true })
  ).toBeVisible()
  await page.getByLabel('Signed in', { exact: true }).uncheck()
  await expect(editor).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Přidat obrázky', exact: true })
  ).toBeDisabled()
})
