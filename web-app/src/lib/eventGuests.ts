export type EventGuest = {
  name: string
  userId?: string
}

export type StoredEventGuest = string | EventGuest

export function normalizeEventGuests(
  guests: readonly StoredEventGuest[] | null | undefined
): EventGuest[] {
  if (!guests) return []

  return guests.flatMap((guest) => {
    if (typeof guest === 'string') {
      const name = guest.trim()
      return name ? [{ name }] : []
    }

    const name = guest.name.trim()
    if (!name) return []

    const userId = guest.userId?.trim()
    return [{ name, ...(userId ? { userId } : {}) }]
  })
}

export function getEventGuestNames(
  guests: readonly StoredEventGuest[] | null | undefined
): string[] {
  return normalizeEventGuests(guests).map((guest) => guest.name)
}
