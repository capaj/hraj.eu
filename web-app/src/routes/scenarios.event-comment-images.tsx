import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  EventComments,
  type EventCommentActions
} from '~/components/events/EventComments'
import type { EventComment, User } from '~/types'

export const Route = createFileRoute('/scenarios/event-comment-images')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: EventCommentImagesScenario
})

const player: User = {
  id: 'anna',
  name: 'Anna Dvořáková',
  email: 'anna@example.com',
  karmaPoints: 10,
  skillLevels: {},
  notificationPreferences: {},
  preferredCurrency: 'CZK',
  createdAt: new Date('2026-10-01')
}
const initialComments: EventComment[] = [
  {
    id: 'first',
    eventId: 'preview',
    userId: player.id,
    content:
      'Sraz u brány A, deset minut před začátkem. Přidám sem plánek hřiště.',
    createdAt: new Date('2026-10-22T17:00:00Z'),
    user: player
  }
]

function EventCommentImagesScenario() {
  const [failUpload, setFailUpload] = useState(false)
  const [signedIn, setSignedIn] = useState(true)
  const [uploadCount, setUploadCount] = useState(0)
  const [savedComments] = useState(
    () => new Map(initialComments.map((comment) => [comment.id, comment]))
  )
  const actions: EventCommentActions = {
    add: async ({ content }) => {
      const comment = {
        id: `comment-${savedComments.size}`,
        eventId: 'preview',
        userId: player.id,
        content,
        user: player,
        createdAt: new Date()
      }
      savedComments.set(comment.id, comment)
      return comment
    },
    edit: async ({ commentId, content }) => {
      const comment = { ...savedComments.get(commentId)!, content }
      savedComments.set(commentId, comment)
      return comment
    },
    delete: async ({ commentId }) => {
      savedComments.delete(commentId)
    },
    upload: async (data) => {
      setUploadCount((count) => count + 1)
      await new Promise((resolve) => setTimeout(resolve, 300))
      if (failUpload) throw new Error('Fixture upload failure')
      // The screenshot spec serves local fixture pixels for these R2 URLs.
      return {
        urls: data
          .getAll('images')
          .map(
            () =>
              `https://uploads.hraj.eu/event-comments/preview-${crypto.randomUUID()}.png`
          )
      }
    }
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-white">
          <p className="text-sm text-white/80">FOTBAL · HRAJ.EU</p>
          <h1 className="mt-2 text-3xl font-bold">
            Čtvrteční fotbal v Letňanech
          </h1>
          <p className="mt-2 text-white/80">
            29. října · 18:30 · Sportovní areál Letňany
          </p>
        </div>
        <EventComments
          eventId="preview"
          initialComments={initialComments}
          currentUserId={signedIn ? player.id : undefined}
          mentionableUsers={[player]}
          actions={actions}
        />
        <div className="flex flex-wrap gap-4 rounded-xl bg-white/95 p-4 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={failUpload}
              onChange={(event) => setFailUpload(event.target.checked)}
            />
            Simulate upload failure
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={signedIn}
              onChange={(event) => setSignedIn(event.target.checked)}
            />
            Signed in
          </label>
          <span data-testid="upload-count">Uploads: {uploadCount}</span>
        </div>
      </div>
    </main>
  )
}
