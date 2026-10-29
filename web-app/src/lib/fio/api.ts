import { normalizeAccountNumberForQrPayment } from '../qrCodeGenerator'

export type FioCredit = {
  id: string
  variableSymbol: string
  amountCents: number
  currency: string
  bookedOn: string
}
export type FioStatement = {
  iban: string
  accountNumber: string
  currency: string
  credits: FioCredit[]
}

export class FioError extends Error {
  constructor(public code: string) {
    super(code)
  }
}

export function moneyToCents(amount: number): number {
  const cents = Math.round(amount * 100)
  if (
    !Number.isFinite(amount) ||
    !Number.isSafeInteger(cents) ||
    Math.abs(cents / 100 - amount) > 0.000001
  ) {
    throw new FioError('invalid_amount')
  }
  return cents
}

export function pragueDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function parseFioStatement(payload: unknown): FioStatement {
  const statement = (payload as any)?.accountStatement
  const info = statement?.info
  const iban = normalizeAccountNumberForQrPayment(info?.iban)
  if (
    !iban?.startsWith('CZ') ||
    info?.bankId !== '2010' ||
    info?.currency !== 'CZK' ||
    !info?.accountId
  ) {
    throw new FioError('unsupported_account')
  }
  const transactions = statement.transactionList?.transaction ?? []
  if (!Array.isArray(transactions)) throw new FioError('invalid_response')
  const credits: FioCredit[] = []
  for (const transaction of transactions) {
    const value = (column: number) => transaction?.[`column${column}`]?.value
    const amount = value(1)
    if (typeof amount !== 'number') throw new FioError('invalid_response')
    if (amount <= 0) continue
    const symbol = String(value(5) ?? '').trim()
    if (!/^\d{1,10}$/.test(symbol)) continue
    const id = String(value(22) ?? '')
    const rawDate = value(0)
    const bookedOn =
      typeof rawDate === 'number'
        ? pragueDate(new Date(rawDate))
        : String(rawDate ?? '').slice(0, 10)
    if (!/^\d+$/.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(bookedOn))
      throw new FioError('invalid_response')
    credits.push({
      id,
      variableSymbol: String(Number(symbol)),
      amountCents: moneyToCents(amount),
      currency: String(value(14)),
      bookedOn
    })
  }
  return {
    iban,
    accountNumber: `${info.accountId}/2010`,
    currency: info.currency,
    credits
  }
}

// Period exports are repeatable. The /last endpoint advances Fio's cursor before
// our database commit and could permanently lose payments after a failed write.
export async function fetchFioStatement(
  token: string,
  from: string,
  to: string,
  fetcher: typeof fetch = fetch
): Promise<FioStatement> {
  if (!/^[a-zA-Z0-9]{64}$/.test(token)) throw new FioError('invalid_token')
  try {
    const response = await fetcher(
      `https://fioapi.fio.cz/v1/rest/periods/${token}/${from}/${to}/transactions.json`,
      {
        method: 'GET',
        redirect: 'error',
        signal: AbortSignal.timeout(20_000),
        headers: { Accept: 'application/json' }
      }
    )
    if (!response.ok) {
      if (response.status === 409) throw new FioError('rate_limited')
      if (response.status === 413) throw new FioError('too_many_transactions')
      if ([401, 403, 404, 422].includes(response.status))
        throw new FioError('token_unavailable')
      throw new FioError('bank_unavailable')
    }
    return parseFioStatement(await response.json())
  } catch (error) {
    if (error instanceof FioError) throw error
    // Fetch errors often include the URL, which contains the secret token.
    throw new FioError('bank_unavailable')
  }
}
