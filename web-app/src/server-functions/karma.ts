import type { User } from '../types'

type KarmaRow = {
  userId: string
  points: number
}

export function addEarnedKarma(
  users: User[],
  organized: KarmaRow[],
  attended: KarmaRow[]
) {
  const earnedByUser = new Map<string, number>()

  for (const { userId, points } of [...organized, ...attended]) {
    earnedByUser.set(userId, (earnedByUser.get(userId) ?? 0) + Number(points))
  }

  return users.map((currentUser) => ({
    ...currentUser,
    // Keep explicitly awarded/deducted points and add points earned from events.
    karmaPoints: currentUser.karmaPoints + (earnedByUser.get(currentUser.id) ?? 0)
  }))
}
