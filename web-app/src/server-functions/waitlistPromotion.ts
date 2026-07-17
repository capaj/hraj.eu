export interface WaitlistPromotionParticipant {
  id: number
  status: string
  plusAttendees: string[] | null
}

export function getWaitlistParticipantIdsToPromote(
  participants: WaitlistPromotionParticipant[],
  maxParticipants: number,
  reservedParticipants: number
): number[] {
  let confirmedHeadcount = participants
    .filter((participant) => participant.status === 'confirmed')
    .reduce(
      (total, participant) =>
        total + 1 + (participant.plusAttendees?.length ?? 0),
      0
    )
  const availableCapacity = maxParticipants - reservedParticipants
  const participantIdsToPromote: number[] = []

  for (const participant of participants) {
    if (participant.status !== 'waitlisted') {
      continue
    }

    const participantHeadcount = 1 + (participant.plusAttendees?.length ?? 0)
    if (confirmedHeadcount + participantHeadcount > availableCapacity) {
      break
    }

    participantIdsToPromote.push(participant.id)
    confirmedHeadcount += participantHeadcount
  }

  return participantIdsToPromote
}
