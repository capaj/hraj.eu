import { useEffect, useMemo, useState } from 'react'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import { formatDistanceToNow } from 'date-fns'
import { cs, enUS } from 'date-fns/locale'
import { ClientOnly } from '@tanstack/react-router'
import {
  CheckCircle,
  Edit,
  Loader2,
  MessageCircle,
  Trash2,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { i18n } from '~/lib/i18n'
import { getLocalizedErrorMessage } from '~/lib/errorMessages'
import type { EventComment, User } from '~/types'
import { addEventComment } from '~/server-functions/addEventComment'
import { editEventComment } from '~/server-functions/editEventComment'
import { deleteEventComment } from '~/server-functions/deleteEventComment'
import { uploadEventCommentImages } from '~/server-functions/uploadEventCommentImages'
import { Card, CardHeader, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'
import { UserAvatar } from '../user/UserAvatar'
import { buildMentionRegex, renderCommentContent } from './EventCommentContent'
import { EventCommentComposer } from './EventCommentComposer'
import {
  MAX_COMMENT_TEXT_LENGTH,
  splitCommentImages
} from '~/utils/eventCommentImages'

type AddComment = { eventId: string; content: string; notifyAttendees: boolean }
type EditComment = { commentId: string; content: string }
export interface EventCommentActions {
  add: (data: AddComment) => Promise<EventComment>
  edit: (data: EditComment) => Promise<EventComment>
  delete: (data: { commentId: string }) => Promise<unknown>
  upload: (data: FormData) => Promise<{ urls: string[] }>
}
const defaultActions: EventCommentActions = {
  add: (data) => addEventComment({ data }),
  edit: (data) => editEventComment({ data }),
  delete: (data) => deleteEventComment({ data }),
  upload: (data) => uploadEventCommentImages({ data })
}

export function EventComments({
  eventId,
  initialComments,
  currentUserId,
  mentionableUsers,
  actions = defaultActions
}: {
  eventId: string
  initialComments: EventComment[]
  currentUserId?: string
  mentionableUsers: User[]
  actions?: EventCommentActions
}) {
  useLingui()
  const dateLocale = i18n.locale === 'cs' ? cs : enUS
  const mentionRegex = useMemo(
    () => buildMentionRegex(mentionableUsers.map((user) => user.name)),
    [mentionableUsers]
  )
  const [isUploadingComment, setIsUploadingComment] = useState(false)
  const [isUploadingEdit, setIsUploadingEdit] = useState(false)
  const [comments, setComments] = useState<EventComment[]>(initialComments)
  const [commentInput, setCommentInput] = useState('')
  const [notifyAttendees, setNotifyAttendees] = useState(true)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(
    null
  )
  const [isEditingComment, setIsEditingComment] = useState(false)
  useEffect(() => setComments(initialComments), [initialComments])

  const handleSubmitComment = async () => {
    if (!eventId || isSubmittingComment || isUploadingComment) return
    if (!currentUserId) {
      toast.error(i18n._(msg`Please sign in to comment on this event.`))
      return
    }

    const trimmed = commentInput.trim()
    if (!trimmed) {
      toast.error(i18n._(msg`Please enter a comment before submitting.`))
      return
    }

    try {
      setIsSubmittingComment(true)
      const newComment = await actions.add({
        eventId,
        content: trimmed,
        notifyAttendees
      })
      setComments((prev) => [...prev, newComment])
      setCommentInput('')
      setNotifyAttendees(true)
    } catch (error) {
      const message = getLocalizedErrorMessage(
        error,
        i18n._(msg`Failed to add comment. Please try again.`)
      )
      toast.error(message)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!currentUserId || isEditingComment || isUploadingEdit) return

    const trimmed = editingCommentContent.trim()
    if (!trimmed) {
      toast.error(i18n._(msg`Comment cannot be empty.`))
      return
    }

    try {
      setIsEditingComment(true)
      const updatedComment = await actions.edit({ commentId, content: trimmed })
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updatedComment : c))
      )
      setEditingCommentId(null)
      setEditingCommentContent('')
      toast.success(i18n._(msg`Comment updated.`))
    } catch (error) {
      const message = getLocalizedErrorMessage(
        error,
        i18n._(msg`Failed to update comment. Please try again.`)
      )
      toast.error(message)
    } finally {
      setIsEditingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return

    try {
      setIsDeletingComment(commentId)
      await actions.delete({ commentId })
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast.success(i18n._(msg`Comment deleted.`))
    } catch (error) {
      const message = getLocalizedErrorMessage(
        error,
        i18n._(msg`Failed to delete comment. Please try again.`)
      )
      toast.error(message)
    } finally {
      setIsDeletingComment(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle size={18} className="mr-2" />
            <Trans>Comments</Trans>
          </h3>
          <Badge variant="default" size="sm">
            {comments.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">
              <Trans>Be the first to leave a comment.</Trans>
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start gap-3 rounded-lg bg-gray-50 p-4"
              >
                <UserAvatar user={comment.user} className="w-10 h-10" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {comment.user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        <ClientOnly>
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: dateLocale
                          })}
                        </ClientOnly>
                      </span>
                    </div>
                    {currentUserId === comment.userId && (
                      <div className="flex items-center gap-1">
                        {editingCommentId === comment.id ? (
                          <>
                            <button
                              type="button"
                              disabled={isEditingComment || isUploadingEdit}
                              onClick={() => {
                                setEditingCommentId(null)
                                setEditingCommentContent('')
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title={i18n._(msg`Cancel`)}
                            >
                              <XCircle size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditComment(comment.id)}
                              disabled={
                                isEditingComment ||
                                isUploadingEdit ||
                                !editingCommentContent.trim() ||
                                splitCommentImages(editingCommentContent).text
                                  .length > MAX_COMMENT_TEXT_LENGTH
                              }
                              className="p-1 text-primary-600 hover:text-primary-700 rounded disabled:opacity-50"
                              title={i18n._(msg`Save`)}
                            >
                              {isEditingComment ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <CheckCircle size={16} />
                              )}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={isEditingComment || isUploadingEdit}
                              onClick={() => {
                                setEditingCommentId(comment.id)
                                setEditingCommentContent(comment.content)
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title={i18n._(msg`Edit`)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={
                                isDeletingComment === comment.id ||
                                isEditingComment ||
                                isUploadingEdit
                              }
                              className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                              title={i18n._(msg`Delete`)}
                            >
                              {isDeletingComment === comment.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <EventCommentComposer
                      value={editingCommentContent}
                      onChange={setEditingCommentContent}
                      label={i18n._(msg`Edit comment`)}
                      disabled={isEditingComment}
                      onUploadingChange={setIsUploadingEdit}
                      uploadImages={actions.upload}
                      eventId={eventId}
                      users={mentionableUsers}
                      autoFocus
                    />
                  ) : (
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {renderCommentContent(comment.content, mentionRegex)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <EventCommentComposer
            value={commentInput}
            onChange={setCommentInput}
            label={i18n._(msg`Leave a comment`)}
            disabled={!currentUserId || isSubmittingComment}
            onUploadingChange={setIsUploadingComment}
            uploadImages={actions.upload}
            eventId={eventId}
            users={mentionableUsers}
          />
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <Toggle
              checked={notifyAttendees}
              onChange={setNotifyAttendees}
              disabled={!currentUserId || isSubmittingComment}
              size="sm"
              className="w-full flex-row-reverse items-start justify-between gap-4"
            >
              <span className="block text-left">
                <span className="block text-sm font-medium text-gray-900">
                  <Trans>Notify attendees by email</Trans>
                </span>
                <span className="mt-1 block text-xs font-normal leading-relaxed text-gray-600">
                  {notifyAttendees ? (
                    <Trans>
                      All other confirmed attendees with event emails enabled
                      will receive this comment in their next hourly digest.
                      @mentions do not limit who is emailed.
                    </Trans>
                  ) : (
                    <Trans>
                      No email will be sent. The comment will still be visible
                      in the event discussion.
                    </Trans>
                  )}
                </span>
              </span>
            </Toggle>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitComment}
              disabled={
                !currentUserId ||
                isSubmittingComment ||
                isUploadingComment ||
                !commentInput.trim() ||
                splitCommentImages(commentInput).text.length >
                  MAX_COMMENT_TEXT_LENGTH
              }
            >
              {isSubmittingComment ? (
                <Trans>Posting...</Trans>
              ) : (
                <Trans>Post comment</Trans>
              )}
            </Button>
          </div>
          {!currentUserId && (
            <p className="mt-2 text-xs text-gray-500">
              <Trans>Sign in to join the conversation.</Trans>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
