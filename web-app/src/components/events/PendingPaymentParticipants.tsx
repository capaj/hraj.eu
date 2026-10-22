import { Trans } from '@lingui/react/macro'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'

export function PendingPaymentParticipants({
  players,
  currentUserId,
  organizerId,
  busy = false,
  onCancel
}: {
  players: { id: string; name: string }[]
  currentUserId?: string
  organizerId: string
  busy?: boolean
  onCancel: (userId: string) => void
}) {
  if (!players.length) return null
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">
          <Trans>Waiting for payment</Trans>
        </h2>
      </CardHeader>
      <CardContent className="space-y-3 p-6">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between gap-3"
          >
            <span>{player.name}</span>
            {(player.id === currentUserId || currentUserId === organizerId) && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onCancel(player.id)}
              >
                <Trans>Cancel place</Trans>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
