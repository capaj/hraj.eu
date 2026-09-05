export const MIN_EVENT_PLAYERS = 2

export interface EventParticipantLimits {
  minParticipants: number
  idealParticipants: number
  maxParticipants: number
}

const toPlayerCount = (value: number, fallback: number) =>
  Number.isFinite(value)
    ? Math.max(MIN_EVENT_PLAYERS, Math.trunc(value))
    : fallback

export function normalizeEventParticipantLimits({
  minParticipants,
  idealParticipants,
  maxParticipants
}: EventParticipantLimits): EventParticipantLimits {
  const normalizedMax = toPlayerCount(maxParticipants, MIN_EVENT_PLAYERS)
  const normalizedMin = Math.min(
    normalizedMax,
    toPlayerCount(minParticipants, MIN_EVENT_PLAYERS)
  )
  const normalizedIdeal = Math.min(
    normalizedMax,
    Math.max(
      normalizedMin,
      toPlayerCount(idealParticipants, normalizedMin)
    )
  )

  return {
    minParticipants: normalizedMin,
    idealParticipants: normalizedIdeal,
    maxParticipants: normalizedMax
  }
}
