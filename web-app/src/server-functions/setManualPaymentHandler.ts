import { and, eq } from 'drizzle-orm'
import type { db } from '../../drizzle/db'
import { eventT, participantT } from '../../drizzle/schema'

export async function setManualPaymentHandler(
  database: typeof db,
  input: {
    eventId: string
    actorId: string
    targetUserId?: string
    paid: boolean
  }
) {
  return database.transaction(async (tx) => {
    const [event] = await tx
      .select()
      .from(eventT)
      .where(eq(eventT.id, input.eventId))
    if (!event) throw new Error('Event not found')
    if (event.paymentMode === 'fio')
      throw new Error('Fio payments can only be confirmed by the bank')
    const targetUserId = input.targetUserId ?? input.actorId
    if (
      (event.requirePayment || targetUserId !== input.actorId) &&
      event.organizerId !== input.actorId
    ) {
      throw new Error('Only the organizer can verify advance payments')
    }
    const [participant] = await tx
      .select()
      .from(participantT)
      .where(
        and(
          eq(participantT.eventId, event.id),
          eq(participantT.userId, targetUserId)
        )
      )
    if (
      !participant ||
      !['confirmed', 'pending_payment'].includes(participant.status)
    )
      throw new Error('You must join this event to mark payment')
    const now = new Date()
    let status = participant.status
    if (event.requirePayment && ['open', 'confirmed'].includes(event.status))
      status = input.paid ? 'confirmed' : 'pending_payment'
    await tx
      .update(participantT)
      .set({
        markedAsPaidAt: input.paid ? now : null,
        paymentIntentRecordedAt: participant.paymentIntentRecordedAt ?? now,
        status
      })
      .where(eq(participantT.id, participant.id))
    return { success: true, markedAsPaidAt: input.paid ? now : null }
  })
}
