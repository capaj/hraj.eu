import { pragueDate, type FioCredit } from './api'

export function paymentVariableSymbol(id: number): string {
  if (!Number.isSafeInteger(id) || id < 1 || id > 8_999_999_999)
    throw new Error('Payment reference range exhausted')
  return String(1_000_000_000 + id)
}

export function fixedPriceCents(
  price: number | null | undefined,
  people: number
): number {
  if (
    !price ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isInteger(people) ||
    people < 1
  )
    throw new Error('Payment requires a positive price')
  const cents = Math.round((price * 100) / people)
  if (cents < 1 || cents > 999_999_999)
    throw new Error('Payment requires a positive price')
  return cents
}

export function matchesPayment(
  request: { id: number; currency: string; createdAt: Date },
  credit: FioCredit
): boolean {
  return (
    credit.variableSymbol === paymentVariableSymbol(request.id) &&
    credit.currency === request.currency &&
    credit.amountCents > 0 &&
    credit.bookedOn >= pragueDate(request.createdAt)
  )
}

export function attendanceAfterPayment(
  status: string,
  eventStatus: string,
  paid: boolean
): 'confirmed' | null {
  return status === 'pending_payment' &&
    ['open', 'confirmed'].includes(eventStatus) &&
    paid
    ? 'confirmed'
    : null
}

export function occupiesSpot(status: string): boolean {
  return status === 'confirmed' || status === 'pending_payment'
}
