export function isCancellableEventStatus(status: string): boolean {
  return status === 'open' || status === 'confirmed'
}

export function normalizeCancellationReason(
  reason: string | undefined
): string | null {
  return reason?.trim() || null
}
