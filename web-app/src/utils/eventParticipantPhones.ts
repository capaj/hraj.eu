type ParticipantPhoneAccessRow = {
  userId: string
  status: string
}

export function canViewEventParticipantPhones(
  viewerId: string | undefined,
  organizerId: string,
  participants: ParticipantPhoneAccessRow[]
): boolean {
  if (!viewerId) return false
  if (viewerId === organizerId) return true

  return participants.some(
    (participant) =>
      participant.userId === viewerId && participant.status === 'confirmed'
  )
}

export function getConfirmedParticipantIds(
  participants: ParticipantPhoneAccessRow[]
): string[] {
  return participants
    .filter((participant) => participant.status === 'confirmed')
    .map((participant) => participant.userId)
}
