// Czech QR Platba (SPAYD): https://qr-platba.cz/pro-vyvojare/specifikace-formatu/
// Domestic-account conversion follows capaj/faktorio's qrCodeGenerator.
const CZECH_DOMESTIC_ACCOUNT = /^(?:(\d{1,6})-)?(\d{1,10})\/(\d{4})$/

function mod97(value: string): number {
  let remainder = 0
  for (const digit of value) remainder = (remainder * 10 + Number(digit)) % 97
  return remainder
}

export function normalizeAccountNumberForQrPayment(
  accountNumber: string | null | undefined
): string | null {
  const account = accountNumber?.replace(/\s/g, '').toUpperCase()
  if (!account) return null

  const domestic = account.match(CZECH_DOMESTIC_ACCOUNT)
  if (domestic) {
    const [, prefix = '', number, bank] = domestic
    if (!/[1-9]/.test(number) || bank === '0000') return null
    const bban = `${bank}${prefix.padStart(6, '0')}${number.padStart(10, '0')}`
    const checkDigits = String(98 - mod97(`${bban}123500`)).padStart(2, '0')
    return `CZ${checkDigits}${bban}`
  }

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(account)) return null
  if (account.startsWith('CZ') && !/^CZ\d{22}$/.test(account)) return null
  const rearranged = (account.slice(4) + account.slice(0, 4)).replace(
    /[A-Z]/g,
    (letter) => String(letter.charCodeAt(0) - 55)
  )
  return mod97(rearranged) === 1 ? account : null
}

export function generateQrPaymentString({
  accountNumber,
  amount,
  currency = 'CZK',
  message
}: {
  accountNumber: string | null | undefined
  amount?: number
  currency?: string
  message?: string
}): string | null {
  const account = normalizeAccountNumberForQrPayment(accountNumber)
  if (!account || !/^[A-Z]{3}$/.test(currency)) return null
  const fields = ['SPD', '1.0', `ACC:${account}`]
  if (amount !== undefined) {
    if (!Number.isFinite(amount) || amount <= 0 || amount > 9999999.99) return null
    fields.push(`AM:${amount.toFixed(2)}`)
  }
  fields.push(`CC:${currency}`)
  // Keep messages bank-friendly and prevent event titles from injecting fields.
  const safeMessage = message?.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9 $+\-./:]/g, ' ').replace(/\s+/g, ' ')
    .trim().slice(0, 60).trim()
  if (safeMessage) fields.push(`MSG:${safeMessage}`)
  return fields.join('*')
}
