import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { GiphyPicker } from '../components/ui/GiphyPicker'
import { MentionDropdown } from '../components/ui/MentionDropdown'
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip'
import { WeatherWidget } from '../components/weather/WeatherWidget'
import { SPORTS, FACILITIES } from '../lib/constants'
import { UserAvatar } from '../components/user/UserAvatar'
import {
  generateICalEvent,
  downloadICalFile,
  CalendarEvent
} from '../utils/calendar'
import { VenueMapPreview } from '../components/venues/VenueMapPreview'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  User as UserIcon,
  ArrowLeft,
  Share2,
  Heart,
  CalendarPlus,
  Target,
  House,
  AlertTriangle,
  CheckCircle,
  Star,
  CoinsIcon,
  UserX,
  Flag,
  Phone,
  Mail,
  Globe,
  Image as ImageIcon,
  Loader2,
  Facebook,
  Twitter,
  MessageCircle,
  Send,
  Edit,
  XCircle,
  ChevronDown,
  Copy,
  Trash2,
  Info
} from 'lucide-react'
import { format, isPast, addMinutes, formatDistanceToNow } from 'date-fns'
import { enUS, cs } from 'date-fns/locale'
import { msg } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { i18n } from '~/lib/i18n'
import { toast } from 'sonner'
import {
  FacebookShare,
  TwitterShare,
  WhatsappShare,
  TelegramShare
} from 'react-share-kit'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../components/ui/dropdown-menu'

import { useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client'
import { joinEvent } from '~/server-functions/joinEvent'
import { leaveEvent } from '~/server-functions/leaveEvent'
import { updatePlusAttendees } from '~/server-functions/updatePlusAttendees'
import { getUserById } from '~/server-functions/getUserById'
import { recordPaymentIntent } from '~/server-functions/recordPaymentIntent'
import { markParticipantAsPaid } from '~/server-functions/markParticipantAsPaid'
import { unmarkParticipantAsPaid } from '~/server-functions/unmarkParticipantAsPaid'
import { addEventComment } from '~/server-functions/addEventComment'
import { deleteEventComment } from '~/server-functions/deleteEventComment'
import { editEventComment } from '~/server-functions/editEventComment'
import { EventComment, User } from '../types'
import { getEventDateTime } from '../utils/eventDateTime'
import { getConfirmedHeadcount } from '../utils/participants'

interface KarmaFeedback {
  userId: string
  rating: number
  comment?: string
  noShow?: boolean
  badBehavior?: boolean
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildMentionRegex = (names: string[]) => {
  if (names.length === 0) return null
  const escapedNames = names
    .map((name) => name.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((name) => escapeRegExp(name))
  if (escapedNames.length === 0) return null
  return new RegExp(`@(${escapedNames.join('|')})`, 'gi')
}

const renderMentions = (text: string, mentionRegex: RegExp | null) => {
  if (!mentionRegex) return [text]
  mentionRegex.lastIndex = 0
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = mentionRegex.exec(text)) !== null) {
    const matchIndex = match.index
    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex))
    }
    nodes.push(
      <span
        key={`mention-${matchIndex}-${match[0]}`}
        className="font-semibold text-primary-600"
      >
        {match[0]}
      </span>
    )
    lastIndex = matchIndex + match[0].length
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }
  return nodes
}

const renderMarkdownSegments = (
  text: string,
  mentionRegex: RegExp | null
): React.ReactNode[] => {
  const patterns = [
    { type: 'bold', regex: /\*\*(.+?)\*\*/s },
    { type: 'underline', regex: /__(.+?)__/s },
    { type: 'italic', regex: /\*(.+?)\*/s }
  ]

  let earliestMatch:
    | { type: string; match: RegExpExecArray; index: number }
    | undefined

  for (const pattern of patterns) {
    const match = pattern.regex.exec(text)
    if (match && (earliestMatch === undefined || match.index < earliestMatch.index)) {
      earliestMatch = { type: pattern.type, match, index: match.index }
    }
  }

  if (!earliestMatch) {
    return renderMentions(text, mentionRegex)
  }

  const before = text.slice(0, earliestMatch.index)
  const after = text.slice(earliestMatch.index + earliestMatch.match[0].length)
  const inner = earliestMatch.match[1]

  const nodes: React.ReactNode[] = []
  if (before) {
    nodes.push(...renderMentions(before, mentionRegex))
  }

  const innerNodes = renderMarkdownSegments(inner, mentionRegex)

  if (earliestMatch.type === 'bold') {
    nodes.push(<strong key={`bold-${earliestMatch.index}`}>{innerNodes}</strong>)
  } else if (earliestMatch.type === 'underline') {
    nodes.push(
      <span key={`underline-${earliestMatch.index}`} className="underline">
        {innerNodes}
      </span>
    )
  } else if (earliestMatch.type === 'italic') {
    nodes.push(<em key={`italic-${earliestMatch.index}`}>{innerNodes}</em>)
  }

  if (after) {
    nodes.push(...renderMarkdownSegments(after, mentionRegex))
  }

  return nodes
}

const isGifUrl = (text: string): boolean => {
  const trimmed = text.trim()
  return /^https?:\/\/.*\.(gif|webp)(\?.*)?$/i.test(trimmed) ||
    /^https?:\/\/media[0-9]*\.giphy\.com\//i.test(trimmed)
}

const renderCommentContent = (content: string, mentionRegex: RegExp | null) => {
  const lines = content.split(/\r?\n/)
  return lines.flatMap((line, lineIndex) => {
    const trimmedLine = line.trim()

    // Check if the entire line is a GIF URL
    if (isGifUrl(trimmedLine)) {
      const nodes: React.ReactNode[] = [
        <img
          key={`gif-${lineIndex}`}
          src={trimmedLine}
          alt="GIF"
          className="max-w-full max-h-64 rounded-lg mt-2"
          loading="lazy"
        />
      ]
      if (lineIndex < lines.length - 1) {
        nodes.push(<br key={`line-break-${lineIndex}`} />)
      }
      return nodes
    }

    const nodes = renderMarkdownSegments(line, mentionRegex)
    if (lineIndex < lines.length - 1) {
      nodes.push(<br key={`line-break-${lineIndex}`} />)
    }
    return nodes
  })
}



export const EventDetailsPage: React.FC = () => {
  const {
    event: initialEvent,
    venue,
    organizer,
    participants: participantUsers,
    comments: initialComments
  } = useLoaderData({ from: '/events/$eventId' })
  const navigate = useNavigate()
  const session = authClient.useSession()
  const [event, setEvent] = useState(initialEvent)
  const [showKarmaModal, setShowKarmaModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [karmaRating, setKarmaRating] = useState(5)
  const [karmaComment, setKarmaComment] = useState('')
  const [reportType, setReportType] = useState<
    'none' | 'no-show' | 'bad-behavior'
  >('none')
  const [isSubmittingKarma, setIsSubmittingKarma] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [participants, setParticipants] = useState<User[]>(
    participantUsers || []
  )
  const [comments, setComments] = useState<EventComment[]>(
    initialComments || []
  )
  const [commentInput, setCommentInput] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null)
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [mentionState, setMentionState] = useState<{
    isActive: boolean
    query: string
    startIndex: number
    position: { top: number; left: number }
  } | null>(null)
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(false)
  const [plusAttendees, setPlusAttendees] = useState<string[]>([])
  const [isUpdatingGuests, setIsUpdatingGuests] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)
  const [selectedQrImage, setSelectedQrImage] = useState<string | null>(null)
  const declinePaymentButtonRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)
  const qrDialogRef = useRef<HTMLDivElement | null>(null)
  const currentUserId = session.data?.user?.id

  // Check if current user is a participant
  const isParticipant = currentUserId
    ? event.participants.includes(currentUserId)
    : false

  const participantsMap = new Map(participants.map((user) => [user.id, user]))

  const participantUsersList = event.participants
    .map((id) => participantsMap.get(id))
    .filter((user): user is NonNullable<typeof user> => user !== undefined)

  const paidParticipants = new Set(event.paidParticipants ?? [])
  const isCurrentUserPaid = currentUserId
    ? paidParticipants.has(currentUserId)
    : false

  const mentionableUsers = useMemo(() => {
    const users = [...participants]
    if (organizer && !users.find((user) => user.id === organizer.id)) {
      users.push(organizer)
    }
    return users
  }, [participants, organizer])

  const mentionRegex = useMemo(() => {
    const names = mentionableUsers.map((user) => user.name).filter(Boolean)
    return buildMentionRegex(names)
  }, [mentionableUsers])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    if (!selectedQrImage) {
      const previouslyFocusedElement = previouslyFocusedElementRef.current
      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus()
      }
      previouslyFocusedElementRef.current = null
      return
    }

    if (!previouslyFocusedElementRef.current) {
      const activeElement = document.activeElement
      previouslyFocusedElementRef.current =
        activeElement instanceof HTMLElement ? activeElement : null
    }

    declinePaymentButtonRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCurrentUserPaid) {
        e.stopPropagation()
        setSelectedQrImage(null)
        return
      }

      if (e.key === 'Tab' && qrDialogRef.current) {
        if (!qrDialogRef.current.contains(document.activeElement)) {
          return
        }

        const focusable = Array.from(
          qrDialogRef.current.querySelectorAll<HTMLElement>(
            'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])'
          )
        )

        if (focusable.length === 0) {
          return
        }

        const activeElement = document.activeElement
        let currentIndex =
          activeElement instanceof HTMLElement
            ? focusable.indexOf(activeElement)
            : -1

        if (currentIndex === -1) {
          currentIndex = 0
        }

        let nextIndex: number
        if (e.shiftKey) {
          nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1
        } else {
          nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1
        }

        e.preventDefault()
        focusable[nextIndex]?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isCurrentUserPaid, selectedQrImage])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href)
    }
  }, [])

  useEffect(() => {
    setEvent(initialEvent)
    setCommentInput('')
  }, [initialEvent])

  useEffect(() => {
    setParticipants(participantUsers || [])
  }, [participantUsers])

  useEffect(() => {
    setComments(initialComments || [])
  }, [initialComments])

  useEffect(() => {
    if (!selectedQrImage || !event || !currentUserId) {
      return
    }

    if (!event.participants.includes(currentUserId)) {
      return
    }

    const recordIntent = async () => {
      try {
        await recordPaymentIntent({ data: { eventId: event.id } })
      } catch (error) {
        console.error('Failed to record payment intent:', error)
      }
    }

    recordIntent()
  }, [selectedQrImage, event, currentUserId])

  if (!event) {
    return (
      <div>
        <Trans>Event not found</Trans>
      </div>
    )
  }

  const sport = SPORTS.find((s) => s.id === event.sport)
  const confirmedHeadcount = getConfirmedHeadcount(event)
  const isSpotAvailable = confirmedHeadcount < event.maxParticipants
  const spotsLeft = Math.max(event.maxParticipants - confirmedHeadcount, 0)
  const isMinimumReached = confirmedHeadcount >= event.minParticipants
  const isIdealReached =
    event.idealParticipants && confirmedHeadcount >= event.idealParticipants

  const getEventStartDateTime = () => {
    if (!event) {
      return new Date()
    }
    return getEventDateTime({ date: event.date, startTime: event.startTime })
  }

  // Check if event has ended (event date + duration has passed)
  const eventStartTime = getEventStartDateTime()
  const durationMinutes = Number(event.duration) || 0
  const eventEndTime = addMinutes(eventStartTime, durationMinutes)
  const hasEventEnded = isPast(eventEndTime)



  useEffect(() => {
    if (!currentUserId) {
      setPlusAttendees([])
      return
    }

    setPlusAttendees(event.participantPlusOnes?.[currentUserId] || [])
  }, [currentUserId, event.participantPlusOnes, event.participants])

  const shouldShowWeather = venue?.type !== 'indoor'

  const getEventStatus = () => {
    if (!isMinimumReached) {
      return {
        variant: 'error' as const,
        text: i18n._(msg`Need {count} more players to confirm`.id, {
          count: event.minParticipants - confirmedHeadcount
        }),
        icon: <AlertTriangle size={16} className="mr-1" />
      }
    } else if (isIdealReached) {
      return {
        variant: 'success' as const,
        text: i18n._(msg`Event confirmed - ideal number reached!`),
        icon: <CheckCircle size={16} className="mr-1" />
      }
    } else {
      return {
        variant: 'warning' as const,
        text: i18n._(msg`Event confirmed - {count} more for ideal`.id, {
          count: event.idealParticipants! - confirmedHeadcount
        }),
        icon: <Target size={16} className="mr-1" />
      }
    }
  }

  const eventStatus = getEventStatus()
  const dateLocale = i18n.locale === 'cs' ? cs : enUS

  const paidAtForCurrentUser = currentUserId
    ? event.paidParticipantsAt?.[currentUserId]
    : undefined

  const paidStatusText = paidAtForCurrentUser
    ? i18n._(
      msg`Marked as paid {timeAgo}`.id,
      {
        timeAgo: formatDistanceToNow(new Date(paidAtForCurrentUser), {
          addSuffix: true,
          locale: dateLocale
        })
      }
    )
    : i18n._(msg`Marked as paid`)

  let joinButtonText = i18n._(msg`Join Waitlist`)
  if (isParticipant) {
    joinButtonText = i18n._(msg`You are playing`)
  } else if (isSpotAvailable) {
    joinButtonText = i18n._(msg`Join Game`)
  }

  let venueTypeText = i18n._(msg`Outdoor venue`)
  if (venue?.type === 'indoor') {
    venueTypeText = i18n._(msg`Indoor venue`)
  } else if (venue?.type === 'mixed') {
    venueTypeText = i18n._(msg`Indoor & outdoor venue`)
  }

  let karmaPlaceholder = i18n._(
    msg`Share your experience playing with this person...`
  )
  if (reportType === 'no-show') {
    karmaPlaceholder = i18n._(msg`Please describe what happened...`)
  } else if (reportType === 'bad-behavior') {
    karmaPlaceholder = i18n._(msg`Please describe the behavior issue...`)
  }

  const getCancellationDeadline = () => {
    if (!event.cancellationDeadlineHours) return null

    const eventDateTime = getEventStartDateTime()

    const deadlineTime = new Date(
      eventDateTime.getTime() - event.cancellationDeadlineHours * 60 * 60 * 1000
    )

    return {
      time: deadlineTime,
      formatted: format(
        deadlineTime,
        i18n.locale === 'cs' ? "EEEE, d. MMMM 'v' HH:mm" : "EEEE, MMMM d 'at' HH:mm",
        { locale: dateLocale }
      )
    }
  }

  const cancellationDeadline = getCancellationDeadline()

  const handleAddToCalendar = () => {
    // Parse the start time and create proper Date objects
    const startDate = getEventStartDateTime()

    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + durationMinutes)

    const calendarEvent: CalendarEvent = {
      title: event.title,
      description: [
        event.description,
        '',
        i18n._(msg`Sport: {sportName}`.id, { sportName: sport?.name ?? '' }),
        i18n._(msg`Participants: {current}/{max}`.id, {
          current: confirmedHeadcount,
          max: event.maxParticipants
        }),
        ...(event.idealParticipants
          ? [
            i18n._(msg`Ideal: {count} players`.id, {
              count: event.idealParticipants
            })
          ]
          : []),
        ...(event.price
          ? [
            i18n._(msg`Price: €{price} per person`.id, {
              price: event.price
            })
          ]
          : []),
        ...(event.paymentDetails
          ? [
            i18n._(msg`Payment: {paymentDetails}`.id, {
              paymentDetails: event.paymentDetails
            })
          ]
          : []),
        ...(event.gameRules
          ? ['', i18n._(msg`Game Rules:`), event.gameRules]
          : []),
        '',
        i18n._(msg`Event created via hraj.eu`)
      ].join('\n'),
      location: venue?.address || i18n._(msg`Location TBD`),
      startDate,
      endDate
      // TODO: Add organizer name when fetching user data
    }

    const icalContent = generateICalEvent(calendarEvent)
    const filename = `${event.title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()}.ics`

    downloadICalFile(icalContent, filename)
  }

  const sanitizePlusAttendees = () => {
    const trimmed = plusAttendees.map((name) => name.trim())
    const hasAnyGuest = trimmed.some(Boolean)
    const hasEmptyName = trimmed.some(
      (name, index) => hasAnyGuest && plusAttendees[index] !== undefined && !name
    )

    if (hasEmptyName) {
      throw new Error(i18n._(msg`Please enter a name for each guest.`))
    }

    return trimmed.filter(Boolean).slice(0, 2)
  }

  const handleJoinEvent = async () => {
    if (!event) {
      return
    }

    if (!currentUserId) {
      toast.error(i18n._(msg`Please sign in to join this event.`))
      navigate({ to: '/auth/$pathname', params: { pathname: 'sign-in' } })
      return
    }

    try {
      setIsJoining(true)
      const cleanedPlusAttendees = sanitizePlusAttendees()
      const response = await joinEvent({
        data: { eventId: event.id, plusAttendees: cleanedPlusAttendees }
      })

      if (response?.participants) {
        setEvent((prev) => ({
          ...prev,
          participants: response.participants.confirmed,
          waitlist: response.participants.waitlisted,
          participantPlusOnes: response.participants.plusAttendees
        }))

        const existingIds = new Set(participants.map((u) => u.id))
        const newParticipantIds = response.participants.confirmed.filter(
          (id) => !existingIds.has(id)
        )

        if (newParticipantIds.length > 0) {
          const newParticipants = await Promise.all(
            newParticipantIds.map((id) => getUserById({ data: id }))
          )
          setParticipants((prev) => [...prev, ...newParticipants])
        }

        if (currentUserId) {
          setPlusAttendees(
            response.participants.plusAttendees[currentUserId] ||
            cleanedPlusAttendees
          )
        }
      }

      if (response?.status === 'waitlisted') {
        toast.info(
          i18n._(
            msg`This event is full right now, so you were added to the waitlist.`
          )
        )
      } else if (response?.status === 'confirmed') {
        toast.success(i18n._(msg`You have successfully joined this game.`))
      } else {
        toast.info(i18n._(msg`Your request was received.`))
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to join the event. Please try again.`)
      toast.error(message)
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveEvent = async () => {
    if (!event || !currentUserId) return

    try {
      setIsJoining(true) // Reusing isJoining state for loading UI
      const response = await leaveEvent({ data: { eventId: event.id } })

      if (response?.participants) {
        setEvent((prev) => ({
          ...prev,
          participants: response.participants.confirmed,
          waitlist: response.participants.waitlisted,
          participantPlusOnes: response.participants.plusAttendees
        }))

        if (currentUserId) {
          setPlusAttendees([])
        }

        // Removed user is naturally filtered out from participants list render
        // because event.participants (ids) is updated.
        // But we might want to keep the user object in `participants` state 
        // so we don't have to refetch if they rejoin? 
        // Actually, we are just maintaining a list of User objects.
        // No need to remove from `participants` state array, 
        // just updating `event.participants` (list of IDs) is enough to trigger re-render
        // and filter the list correctly in `participantUsersList`.

        toast.info(i18n._(msg`You have left the event.`))
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to leave the event. Please try again.`)
      toast.error(message)
    } finally {
      setIsJoining(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!event?.id) return
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
      const newComment = await addEventComment({
        data: { eventId: event.id, content: trimmed }
      })
      setComments((prev) => [...prev, newComment])
      setCommentInput('')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to add comment. Please try again.`)
      toast.error(message)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!currentUserId) return

    const trimmed = editingCommentContent.trim()
    if (!trimmed) {
      toast.error(i18n._(msg`Comment cannot be empty.`))
      return
    }

    try {
      setIsEditingComment(true)
      const updatedComment = await editEventComment({
        data: { commentId, content: trimmed }
      })
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updatedComment : c))
      )
      setEditingCommentId(null)
      setEditingCommentContent('')
      toast.success(i18n._(msg`Comment updated.`))
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to update comment. Please try again.`)
      toast.error(message)
    } finally {
      setIsEditingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return

    try {
      setIsDeletingComment(commentId)
      await deleteEventComment({ data: { commentId } })
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast.success(i18n._(msg`Comment deleted.`))
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to delete comment. Please try again.`)
      toast.error(message)
    } finally {
      setIsDeletingComment(null)
    }
  }

  const handlePlusAttendeeChange = (index: number, value: string) => {
    setPlusAttendees((prev) => {
      const updated = prev.slice()
      updated[index] = value
      return updated
    })
  }

  const handleRemovePlusAttendee = (index: number) => {
    setPlusAttendees((prev) => {
      if (index < 0 || index >= prev.length) return prev
      const updated = prev.slice()
      updated.splice(index, 1)
      return updated
    })
  }

  const normalizePlusAttendees = (attendees: string[]) =>
    attendees
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 2)

  const arePlusAttendeesEqual = (a: string[], b: string[]) =>
    a.length === b.length && a.every((name, index) => name === b[index])

  const savedPlusAttendees = currentUserId
    ? (event.participantPlusOnes?.[currentUserId] ?? [])
    : []

  const isGuestsFormDirty = !arePlusAttendeesEqual(
    normalizePlusAttendees(plusAttendees),
    normalizePlusAttendees(savedPlusAttendees)
  )

  const handleSavePlusAttendees = async () => {
    if (!event || !currentUserId) return

    try {
      setIsUpdatingGuests(true)
      const cleanedPlusAttendees = sanitizePlusAttendees()

      const response = await updatePlusAttendees({
        data: { eventId: event.id, plusAttendees: cleanedPlusAttendees }
      })

      if (response?.participants) {
        setEvent((prev) => ({
          ...prev,
          participants: response.participants.confirmed,
          waitlist: response.participants.waitlisted,
          participantPlusOnes: response.participants.plusAttendees
        }))
        setPlusAttendees(
          response.participants.plusAttendees[currentUserId] ||
          cleanedPlusAttendees
        )
        toast.success(i18n._(msg`Guest list updated.`))
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to update guests. Please try again.`)
      toast.error(message)
    } finally {
      setIsUpdatingGuests(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!event) return

    if (!currentUserId) {
      toast.error(i18n._(msg`Please sign in to confirm payment.`))
      navigate({ to: '/auth/$pathname', params: { pathname: 'sign-in' } })
      return
    }

    if (!isParticipant) {
      toast.error(i18n._(msg`You must join this event to confirm payment.`))
      return
    }

    try {
      setIsMarkingPaid(true)
      const now = new Date()
      await markParticipantAsPaid({ data: { eventId: event.id } })
      setEvent((prev) => {
        const paid = new Set(prev.paidParticipants ?? [])
        paid.add(currentUserId)
        const paidAt = { ...(prev.paidParticipantsAt ?? {}) }
        paidAt[currentUserId] = now
        return {
          ...prev,
          paidParticipants: Array.from(paid),
          paidParticipantsAt: paidAt
        }
      })
      toast.success(i18n._(msg`Payment marked as complete.`))
      setSelectedQrImage(null)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to update payment status. Please try again.`)
      toast.error(message)
    } finally {
      setIsMarkingPaid(false)
    }
  }

  const handleUnmarkPayment = async () => {
    if (!event) return

    if (!currentUserId || !isParticipant) {
      setSelectedQrImage(null)
      return
    }

    if (!isCurrentUserPaid) {
      setSelectedQrImage(null)
      return
    }

    try {
      setIsMarkingPaid(true)
      await unmarkParticipantAsPaid({ data: { eventId: event.id } })
      setEvent((prev) => {
        const paid = new Set(prev.paidParticipants ?? [])
        paid.delete(currentUserId)
        const paidAt = { ...(prev.paidParticipantsAt ?? {}) }
        delete paidAt[currentUserId]
        return {
          ...prev,
          paidParticipants: Array.from(paid),
          paidParticipantsAt: paidAt
        }
      })
      toast.success(i18n._(msg`Payment status cleared.`))
      setSelectedQrImage(null)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n._(msg`Failed to update payment status. Please try again.`)
      toast.error(message)
    } finally {
      setIsMarkingPaid(false)
    }
  }

  const handleOpenKarmaModal = (userId: string) => {
    setSelectedUserId(userId)
    setKarmaRating(5)
    setKarmaComment('')
    setReportType('none')
    setShowKarmaModal(true)
  }

  const handleCloseKarmaModal = () => {
    setShowKarmaModal(false)
    setSelectedUserId(null)
    setKarmaRating(5)
    setKarmaComment('')
    setReportType('none')
  }

  const handleSubmitKarma = async () => {
    if (!selectedUserId) return

    setIsSubmittingKarma(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const feedback: KarmaFeedback = {
      userId: selectedUserId,
      rating: reportType === 'none' ? karmaRating : 1,
      comment: karmaComment,
      noShow: reportType === 'no-show',
      badBehavior: reportType === 'bad-behavior'
    }

    console.log('Karma feedback submitted:', feedback)

    // In a real app, this would make an API call to submit the feedback
    // and update the user's karma points accordingly

    setIsSubmittingKarma(false)
    handleCloseKarmaModal()

    // Show success message
    alert(i18n._(msg`Feedback submitted successfully`))
  }

  const getKarmaButtonText = (rating: number, reportType: string) => {
    if (reportType === 'no-show') return i18n._(msg`Report No-Show`)
    if (reportType === 'bad-behavior') return i18n._(msg`Report Bad Behavior`)
    if (rating >= 4) return i18n._(msg`Give Positive Karma`)
    if (rating >= 3) return i18n._(msg`Give Neutral Karma`)
    return i18n._(msg`Give Negative Karma`)
  }

  const getKarmaButtonVariant = (rating: number, reportType: string) => {
    if (reportType !== 'none') return 'secondary' as const
    if (rating >= 4) return 'primary' as const
    if (rating >= 3) return 'outline' as const
    return 'secondary' as const
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/discover' })}
            className="mb-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft size={16} className="mr-2" />
            <Trans>Back to Events</Trans>
          </Button>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{sport?.icon}</div>
              <div>
                <h1 className="text-3xl font-bold text-white">{event.title}</h1>

                {hasEventEnded && (
                  <Badge variant="default" size="md" className="mt-2">
                    <Trans>Event Completed</Trans>
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {currentUserId === event.organizerId && (
                <>
                  {hasEventEnded ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => {
                        navigate({ to: '/create', search: { duplicateFrom: event.id } })
                      }}
                    >
                      <Copy size={16} className="mr-2" />
                      <Trans>Duplicate Event</Trans>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => navigate({ to: '/edit-event/$eventId', params: { eventId: event.id } })}
                    >
                      <Edit size={16} className="mr-2" />
                      <Trans>Edit Event</Trans>
                    </Button>
                  )}
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={event.status === 'cancelled'}>
                  <Button
                    variant="outline"
                    disabled={event.status === 'cancelled'}
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Share2 size={16} className="mr-2" />
                    <Trans>Share</Trans>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96">
                  <div className="p-2">
                    <div className="text-xs text-muted-foreground mb-2 px-1">
                      <Trans>Preview</Trans>
                    </div>
                    <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-md border bg-muted">
                      <img
                        src={`/api/og/event/${event.id}?v=${new Date(event.updatedAt).getTime()}`}
                        alt="OG Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <FacebookShare url={shareUrl} className="w-full flex items-center cursor-pointer">
                      <Facebook size={20} className="mr-2" />
                      <span>Facebook</span>
                    </FacebookShare>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <TwitterShare url={shareUrl} title={event.title} className="w-full flex items-center cursor-pointer">
                      <Twitter size={20} className="mr-2" />
                      <span>Twitter</span>
                    </TwitterShare>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <WhatsappShare url={shareUrl} title={event.title} className="w-full flex items-center cursor-pointer">
                      <MessageCircle size={20} className="mr-2" />
                      <span>WhatsApp</span>
                    </WhatsappShare>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <TelegramShare url={shareUrl} title={event.title} className="w-full flex items-center cursor-pointer">
                      <Send size={20} className="mr-2" />
                      <span>Telegram</span>
                    </TelegramShare>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Heart size={16} className="mr-2" />
                <Trans>Save</Trans>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  <Trans>Event Details</Trans>
                </h2>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  {event.status === 'cancelled' ? (
                    <Badge variant="destructive" size="md" className="flex items-center w-fit">
                      <AlertTriangle size={16} className="mr-1" />
                      <Trans>Event Cancelled</Trans>
                    </Badge>
                  ) : (
                    <Badge
                      variant={eventStatus.variant}
                      size="md"
                      className="flex items-center w-fit"
                    >
                      {eventStatus.icon}
                      {eventStatus.text}
                    </Badge>
                  )}
                </div>

                {event.status === 'cancelled' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertTriangle
                        size={20}
                        className="text-red-600 mr-3 mt-0.5 flex-shrink-0"
                      />

                      <div className="text-sm">
                        <p className="text-red-800 font-medium mb-1">
                          <Trans>This event has been cancelled</Trans>
                        </p>
                        <p className="text-red-700">
                          <Trans>The organizer has cancelled this event.</Trans>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {event.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      <Trans>About this event</Trans>
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Cancellation Policy */}
                {cancellationDeadline && !isMinimumReached && event.status !== 'cancelled' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertTriangle
                        size={20}
                        className="text-amber-600 mr-3 mt-0.5 flex-shrink-0"
                      />
                      <div className="text-sm">
                        <p className="text-amber-800 font-medium mb-1">
                          <Trans>Cancellation Policy</Trans>
                        </p>
                        <p className="text-amber-700">
                          <Trans>
                            This event will be automatically cancelled if we don't
                            reach the minimum of {event.minParticipants} players
                            by <strong>{cancellationDeadline.formatted}</strong>.
                          </Trans>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 flex items-center whitespace-nowrap">
                        <Calendar size={18} className="mr-2 text-primary-600" />
                        <Trans>Date & Time</Trans>
                      </h3>

                    </div>
                    <div className="space-y-3 ml-6">
                      <div className="flex items-center text-gray-700">
                        <Calendar size={16} className="mr-2 text-gray-500" />
                        <span>
                          {format(event.date, 'PPPP', { locale: dateLocale })}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Clock size={16} className="mr-2 text-gray-500" />
                        <span>
                          {i18n._(msg`{time} ({duration} minutes)`.id, {
                            time: event.startTime,
                            duration: event.duration
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddToCalendar}
                      className="h-8 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <CalendarPlus size={14} className="mr-1.5" />
                      <Trans>Add to Calendar</Trans>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <MapPin size={18} className="mr-2 text-primary-600" />
                      <Trans>Location</Trans>
                    </h3>
                    <div className="ml-6">
                      <div className="flex items-start text-gray-700">
                        <MapPin
                          size={16}
                          className="mr-2 mt-0.5 text-gray-500 flex-shrink-0"
                        />
                        <span>
                          {venue?.address || i18n._(msg`Location TBD`)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Requirements */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center mb-4">
                    <Users size={18} className="mr-2 text-primary-600" />
                    <Trans>Player Requirements</Trans>
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-gray-900">
                        {event.minParticipants}
                      </div>
                      <div className="text-xs text-gray-600">
                        <Trans>Minimum</Trans>
                      </div>
                      <div className="hidden sm:block text-xs text-gray-500 mt-1">
                        <Trans>Required to confirm</Trans>
                      </div>
                    </div>
                    {event.idealParticipants && (
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-900">
                          {event.idealParticipants}
                        </div>
                        <div className="text-xs text-blue-600">
                          <Trans>Ideal</Trans>
                        </div>
                        <div className="hidden sm:block text-xs text-blue-500 mt-1">
                          <Trans>Perfect game size</Trans>
                        </div>
                      </div>
                    )}
                    <div className="text-center p-2 bg-orange-50 rounded-lg">
                      <div className="text-xl font-bold text-orange-900">
                        {event.maxParticipants}
                      </div>
                      <div className="text-xs text-orange-600">
                        <Trans>Maximum</Trans>
                      </div>
                      <div className="hidden sm:block text-xs text-orange-500 mt-1">
                        <Trans>Full capacity</Trans>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizer Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center mb-4">
                    <UserIcon size={18} className="mr-2 text-primary-600" />
                    <Trans>Organizer</Trans>
                  </h3>
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      user={organizer || {}}
                      className="w-12 h-12"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {organizer?.name || i18n._(msg`Event Organizer`)}
                      </div>
                      <div className="text-sm text-gray-500">
                        <Trans>Karma points: {organizer?.karmaPoints}</Trans>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {event.qrCodeImages && event.qrCodeImages.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <ImageIcon size={18} className="mr-2 text-primary-600" />
                    <Trans>QR Codes</Trans>
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  {isParticipant ? (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        <Trans>Click a QR code to view it larger.</Trans>
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {event.qrCodeImages.map((image, index) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setSelectedQrImage(image)}
                            className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:shadow-md transition-shadow"
                          >
                            <img
                              src={image}
                              alt={i18n._(msg`QR code image ${index + 1}`)}
                              className="w-full h-40 object-contain"
                            />
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">
                      <Trans>QR codes are displayed only to participants.</Trans>
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            {event.price && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CoinsIcon size={20} className="mr-2 text-primary-600" />
                    <Trans>Payment</Trans>
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 text-lg">
                        <Trans>Price total:</Trans>
                      </span>
                      <span className="font-bold text-2xl text-primary-600">
                        {event.price} {event.currency ?? 'CZK'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-700 text-lg">
                        <Trans>
                          Price per person(
                          {Math.max(event.minParticipants, confirmedHeadcount)}
                          people):
                        </Trans>
                      </span>
                      <span className="font-bold text-2xl text-primary-600">
                        {(
                          event.price /
                          Math.max(event.minParticipants, confirmedHeadcount)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {event.currency ?? 'CZK'}
                      </span>
                    </div>
                    {event.paymentDetails && (
                      <div className="text-gray-600">
                        <strong>
                          <Trans>Payment details:</Trans>
                        </strong>{' '}
                        {event.paymentDetails}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Game Rules */}
            {event.gameRules && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FileText size={20} className="mr-2 text-primary-600" />
                    <Trans>Game Rules & Guidelines</Trans>
                  </h2>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {event.gameRules}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather Widget */}
            {shouldShowWeather && (
              <WeatherWidget
                date={event.date}
                location={venue?.address || i18n._(msg`Location TBD`)}
                sport={event.sport}
              />
            )}


          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Join Action */}
            {!hasEventEnded && event.status !== 'cancelled' && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center space-x-1 mb-3">
                      <span
                        className={`text-4xl font-extrabold ${isMinimumReached
                          ? 'text-primary-600'
                          : 'text-orange-500'
                          }`}
                      >
                        {confirmedHeadcount}
                      </span>
                      <span className="text-xl text-gray-400 font-medium">
                        / {event.maxParticipants}
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${isMinimumReached ? 'bg-primary-600' : 'bg-orange-500'
                          }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (confirmedHeadcount / event.maxParticipants) * 100
                          )}%`
                        }}
                      />
                    </div>

                    <div className="text-sm text-gray-600 font-medium">
                      <Trans>Players confirmed</Trans>
                    </div>
                    {event.idealParticipants && (
                      <div className="text-xs text-gray-500 mt-1">
                        {i18n._(msg`Ideal: {count} players`.id, {
                          count: event.idealParticipants
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700 flex items-center">
                        <Users size={16} className="mr-2 text-primary-600" />
                        <Trans>Bringing guests?</Trans>
                      </div>
                      <span className="text-xs text-gray-500">
                        <Trans>Up to 2 names</Trans>
                      </span>
                    </div>

                    {[0, 1].map((index) => (
                      <div key={index} className="relative">
                        <input
                          type="text"
                          value={plusAttendees[index] || ''}
                          onChange={(e) =>
                            handlePlusAttendeeChange(index, e.target.value)
                          }
                          placeholder={i18n._(
                            msg`Guest {index, number} name (optional)`.id,
                            { index: index + 1 }
                          )}
                          className="w-full rounded-lg border border-gray-200 pl-3 pr-10 py-2 text-sm focus:border-primary-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={index >= plusAttendees.length}
                          onClick={() => handleRemovePlusAttendee(index)}
                          aria-label={i18n._(msg`Remove`)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    {isParticipant && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            isUpdatingGuests ||
                            isJoining ||
                            !isGuestsFormDirty
                          }
                          onClick={handleSavePlusAttendees}
                        >
                          {isUpdatingGuests ? (
                            <Trans>Saving...</Trans>
                          ) : (
                            <Trans>Save guests</Trans>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full mb-3"
                    disabled={isJoining || isParticipant}
                    onClick={handleJoinEvent}
                  >
                    {joinButtonText}
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    {i18n._(msg`Minimum {count} players needed to confirm`.id, {
                      count: event.minParticipants
                    })}
                  </div>
                  {/* Join message removed, now using toast */}
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            <Card>
              <CardHeader
                className="cursor-pointer lg:cursor-default"
                onClick={() => setIsParticipantsExpanded(!isParticipantsExpanded)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <UserIcon size={18} className="mr-2" />
                    <Trans>Who's Playing</Trans>
                    <ChevronDown
                      size={20}
                      className={`ml-2 lg:hidden transition-transform duration-200 ${isParticipantsExpanded ? 'rotate-180' : ''
                        }`}
                    />
                  </h3>
                  {hasEventEnded && isParticipant && (
                    <Badge variant="info" size="sm">
                      <Trans>Rate Players</Trans>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent
                className={`p-6 ${!isParticipantsExpanded ? 'hidden lg:block' : ''
                  }`}
              >
                <div className="space-y-3">
                  {participantUsersList.map((user) => (
                    <div
                      key={user?.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <UserAvatar
                          user={user || {}}
                          className="w-10 h-10"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-900">
                              {user?.name}
                            </div>
                            {event.organizerId === user?.id && (
                              <Badge variant="info" size="sm">
                                <Trans>Organizer</Trans>
                              </Badge>
                            )}
                            {user?.id && paidParticipants.has(user.id) && (
                              <span
                                className="inline-flex items-center text-green-600"
                                title={i18n._(msg`Paid`)}
                                aria-label={i18n._(msg`Paid`)}
                              >
                                <CheckCircle size={14} />
                                <span className="sr-only">
                                  <Trans>Paid</Trans>
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {i18n._(msg`{karmaPoints} karma`.id, {
                              karmaPoints: user?.karmaPoints ?? 0
                            })}
                          </div>
                          {user?.id &&
                            (event.participantPlusOnes?.[user.id]?.length ?? 0) >
                            0 && (
                              <div className="text-xs text-gray-500">
                                <Trans>Guests:</Trans>{' '}
                                {event.participantPlusOnes[user.id].join(', ')}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Leave button for current user */}
                      {!hasEventEnded &&
                        currentUserId === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={handleLeaveEvent}
                            disabled={isJoining}
                          >
                            <UserX size={16} className="mr-1" />
                            <Trans>Leave</Trans>
                          </Button>
                        )}

                      {/* Karma feedback buttons - only show after event ends and for other participants */}
                      {hasEventEnded &&
                        isParticipant &&
                        user?.id !== currentUserId &&
                        user && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenKarmaModal(user.id)}
                              className="flex items-center"
                            >
                              <Star size={14} className="mr-1" />
                              <Trans>Rate</Trans>
                            </Button>
                          </div>
                        )}
                    </div>
                  ))}

                  {/* Empty spots - only show for future events */}
                  {!hasEventEnded &&
                    Array.from({ length: spotsLeft }, (_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex items-center space-x-3 p-3 border-2 border-dashed border-gray-200 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users size={16} className="text-gray-400" />
                        </div>
                        <span className="text-gray-500">
                          <Trans>Open spot</Trans>
                        </span>
                      </div>
                    ))}
                </div>

                {/* Post-event feedback notice */}
                {hasEventEnded && isParticipant && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <Star
                          size={16}
                          className="text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                        />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">
                            <Trans>Rate Your Fellow Players</Trans>
                          </p>
                          <p>
                            <Trans>
                              Help build our community by giving karma to players
                              who showed good sportsmanship, or report issues if
                              needed.
                            </Trans>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Waitlist */}
            {!isSpotAvailable && (event.waitlist?.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users size={18} className="mr-2" />
                      <Trans>Waitlist</Trans>
                    </h3>
                    <Badge variant="default" size="sm">
                      {event.waitlist?.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {event.waitlist?.map((userId, index) => {
                      const user = participantsMap.get(userId)
                      const isMe = userId === currentUserId
                      return (
                        <div
                          key={userId}
                          className={`flex items-center justify-between p-3 rounded-lg ${isMe ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 text-sm text-gray-400 font-medium">
                              #{index + 1}
                            </div>
                            <UserAvatar
                              user={user || {}}
                              className="w-10 h-10"
                            />
                            <div className="flex-1">
                              <div className={`font-medium ${isMe ? 'text-blue-700' : 'text-gray-900'}`}>
                                {isMe ? i18n._(msg`You`) : (user?.name || i18n._(msg`Player`))}
                              </div>
                              {event.waitlistJoinedAt?.[userId] && (
                                <div className="text-sm text-gray-500">
                                  {i18n._(msg`Joined {timeAgo}`.id, {
                                    timeAgo: formatDistanceToNow(new Date(event.waitlistJoinedAt[userId]), {
                                      addSuffix: true,
                                      locale: dateLocale
                                    })
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Leave waitlist button for current user */}
                          {!hasEventEnded && isMe && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={handleLeaveEvent}
                              disabled={isJoining}
                            >
                              <UserX size={16} className="mr-1" />
                              <Trans>Leave</Trans>
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <Trans>
                        Players on the waitlist will automatically be added when spots become available.
                      </Trans>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* Comments - Full Width */}
        <Card className="mt-8">
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
                    <UserAvatar
                      user={comment.user}
                      className="w-10 h-10"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {comment.user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: dateLocale
                            })}
                          </span>
                        </div>
                        {currentUserId === comment.userId && (
                          <div className="flex items-center gap-1">
                            {editingCommentId === comment.id ? (
                              <>
                                <button
                                  type="button"
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
                                  disabled={isEditingComment}
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
                                  disabled={isDeletingComment === comment.id}
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
                        <textarea
                          value={editingCommentContent}
                          onChange={(e) => setEditingCommentContent(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-primary-500 focus:outline-none"
                          rows={3}
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
              <div className='flex align-baseline'>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Trans>Leave a comment</Trans>
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <Info size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <Trans>
                      Supports **bold**, *italic*, __underline__, @mentions, and GIFs.
                    </Trans>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="relative">
                <textarea
                  ref={commentTextareaRef}
                  value={commentInput}
                  onChange={(e) => {
                    const value = e.target.value
                    const cursorPos = e.target.selectionStart
                    setCommentInput(value)

                    // Detect @ mentions
                    const textBeforeCursor = value.slice(0, cursorPos)
                    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

                    if (mentionMatch) {
                      const query = mentionMatch[1]
                      const startIndex = cursorPos - mentionMatch[0].length

                      // Get cursor position for dropdown placement
                      const textarea = e.target
                      const lineHeight = parseInt(
                        getComputedStyle(textarea).lineHeight
                      )
                      const lines = textBeforeCursor.split('\n')
                      const currentLineIndex = lines.length - 1
                      const top = (currentLineIndex + 1) * lineHeight + 8

                      setMentionState({
                        isActive: true,
                        query,
                        startIndex,
                        position: { top, left: 12 }
                      })
                    } else {
                      setMentionState(null)
                    }
                  }}
                  onKeyDown={(e) => {
                    // Let MentionDropdown handle arrow keys and enter when active
                    if (
                      mentionState?.isActive &&
                      ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(
                        e.key
                      )
                    ) {
                      // MentionDropdown will handle these via document listener
                    }
                  }}
                  onBlur={() => {
                    // Delay closing to allow click on dropdown
                    setTimeout(() => setMentionState(null), 150)
                  }}
                  placeholder={i18n._(
                    msg`Share updates, ask questions, or tag players with @Name.`
                  )}
                  className="w-full rounded-lg border border-gray-200 p-3 pb-10 text-sm focus:border-primary-500 focus:outline-none"
                  rows={4}
                  disabled={!currentUserId || isSubmittingComment}
                />
                {mentionState?.isActive && (
                  <MentionDropdown
                    users={mentionableUsers}
                    searchQuery={mentionState.query}
                    position={mentionState.position}
                    onSelect={(user) => {
                      const before = commentInput.slice(0, mentionState.startIndex)
                      const after = commentInput.slice(
                        mentionState.startIndex + mentionState.query.length + 1
                      )
                      const newValue = `${before}@${user.name} ${after}`
                      setCommentInput(newValue)
                      setMentionState(null)

                      // Refocus textarea and set cursor position
                      setTimeout(() => {
                        const newCursorPos = before.length + user.name.length + 2
                        commentTextareaRef.current?.focus()
                        commentTextareaRef.current?.setSelectionRange(
                          newCursorPos,
                          newCursorPos
                        )
                      }, 0)
                    }}
                    onClose={() => setMentionState(null)}
                  />
                )}
                <div className="absolute bottom-2 left-2">
                  <button
                    type="button"
                    onClick={() => setShowGifPicker(!showGifPicker)}
                    disabled={!currentUserId || isSubmittingComment}
                    className="px-2 py-1 text-xs font-bold text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={i18n._(msg`Add GIF`)}
                  >
                    GIF
                  </button>
                  {showGifPicker && (
                    <GiphyPicker
                      onSelect={(gifUrl) => {
                        setCommentInput((prev) =>
                          prev ? `${prev}\n${gifUrl}` : gifUrl
                        )
                        setShowGifPicker(false)
                      }}
                      onClose={() => setShowGifPicker(false)}
                    />
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={
                    !currentUserId ||
                    isSubmittingComment ||
                    !commentInput.trim()
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

        {/* Venue Information - Full Width */}
        {venue && (
          <Card className="mt-8">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <House size={16} className="mr-2 text-primary-600" />
                <Trans>Venue</Trans>
              </h2>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {venue.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {[venue.address, venue.city, venue.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                    <Badge variant="default">
                      {venueTypeText}
                    </Badge>
                  </div>

                  {venue.description && (
                    <p className="text-gray-700 leading-relaxed">
                      {venue.description}
                    </p>
                  )}

                  {venue.accessInstructions && (
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                      <p className="font-medium mb-1">
                        <Trans>Access Instructions</Trans>
                      </p>
                      <p>{venue.accessInstructions}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {venue.contactInfo?.phone ? (
                      <a
                        href={`tel:${venue.contactInfo.phone}`}
                        className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                      >
                        <Phone size={16} className="mr-2 text-gray-500" />
                        {venue.contactInfo.phone}
                      </a>
                    ) : (
                      <div
                        className="flex items-center text-gray-400"
                        title={i18n._(msg`No phone number available`)}
                      >
                        <Phone size={16} className="mr-2 text-gray-300" />
                        <span className="italic">
                          <Trans>No phone number</Trans>
                        </span>
                      </div>
                    )}

                    {venue.contactInfo?.email && (
                      <a
                        href={`mailto:${venue.contactInfo.email}`}
                        className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                      >
                        <Mail size={16} className="mr-2 text-gray-500" />
                        {venue.contactInfo.email}
                      </a>
                    )}
                    {venue.contactInfo?.website && (
                      <a
                        href={venue.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
                      >
                        <Globe size={16} className="mr-2 text-gray-500" />
                        <Trans>Visit website</Trans>
                      </a>
                    )}
                    {venue.price ? (
                      <div className="flex items-center text-gray-700">
                        <CoinsIcon size={16} className="mr-2 text-gray-500" />
                        {i18n._(msg`Approx. {price} {currency} / hour`.id, {
                          price: venue.price,
                          currency: venue.currency
                        })}
                      </div>
                    ) : null}
                  </div>

                  {venue.facilities && venue.facilities.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        <Trans>Facilities</Trans>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {venue.facilities.map((facilityId) => {
                          const facility = FACILITIES.find(
                            (f) => f.id === facilityId
                          )
                          return (
                            <span
                              key={facilityId}
                              className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 flex items-center"
                            >
                              {facility?.icon && (
                                <span className="mr-1.5">{facility.icon}</span>
                              )}
                              {facility?.name || facilityId}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Venue Images & Orientation Plan */}
                  {((venue.photos && venue.photos.length > 0) ||
                    venue.orientationPlan) && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <ImageIcon size={16} className="mr-2 text-primary-600" />
                          <Trans>Photos & Orientation</Trans>
                        </h4>

                        <div className="space-y-6">
                          {/* Orientation Plan */}
                          {venue.orientationPlan && (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                <Trans>Orientation Plan</Trans>
                              </p>
                              <div className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-95 transition-opacity">
                                <a
                                  href={venue.orientationPlan}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={venue.orientationPlan}
                                    alt={i18n._(msg`{name} Orientation Plan`.id, {
                                      name: venue.name
                                    })}
                                    className="w-full h-auto object-contain max-h-[300px] bg-gray-50"
                                  />
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Venue Photos */}
                          {venue.photos && venue.photos.length > 0 && (
                            <div className="space-y-2">
                              {venue.orientationPlan && (
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                  <Trans>Photos</Trans>
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                {venue.photos.map((img: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video cursor-pointer hover:opacity-95 transition-opacity"
                                  >
                                    <a
                                      href={img}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        src={img}
                                        alt={i18n._(msg`{name} photo {index}`.id, {
                                          name: venue.name,
                                          index: idx + 1
                                        })}
                                        className="w-full h-full object-cover"
                                      />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>

                <div className="h-full min-h-[300px] rounded-lg overflow-hidden">
                  <VenueMapPreview
                    lat={venue.lat}
                    lng={venue.lng}
                    className="w-full h-full min-h-[300px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedQrImage && (
        <div
          className="fixed inset-0 z-[4000] bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-code-dialog-title"
          onClick={
            isCurrentUserPaid ? () => setSelectedQrImage(null) : undefined
          }
        >
          <div
            ref={qrDialogRef}
            className="relative max-w-4xl w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="qr-code-dialog-title" className="sr-only">
              {i18n._(msg`QR code enlarged`)}
            </h2>
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <img
                src={selectedQrImage}
                alt={i18n._(msg`QR code enlarged`)}
                className="w-full max-h-[55vh] sm:max-h-[70vh] object-contain rounded-lg bg-gray-50"
              />
              {isParticipant && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  {!isCurrentUserPaid && (
                    <p className="text-center text-lg sm:text-xl font-semibold text-gray-900">
                      <Trans>Have you paid?</Trans>
                    </p>
                  )}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {!isCurrentUserPaid && (
                      <Button
                        variant="danger"
                        size="lg"
                        className="w-full py-6 text-xl sm:text-2xl"
                        onClick={handleUnmarkPayment}
                        disabled={isMarkingPaid}
                        ref={declinePaymentButtonRef}
                      >
                        <XCircle size={24} className="mr-2" />
                        <Trans>No I have not paid</Trans>
                      </Button>
                    )}
                    {isCurrentUserPaid ? (
                      <div className="flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-6 text-center text-lg sm:text-xl font-semibold text-emerald-700 sm:col-span-2">
                        <CheckCircle size={24} className="mr-2" />
                        <span>{paidStatusText}</span>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full py-6 text-xl sm:text-2xl"
                        onClick={handleMarkAsPaid}
                        disabled={isMarkingPaid}
                      >
                        {isMarkingPaid ? (
                          <>
                            <Loader2 size={24} className="mr-2 animate-spin" />
                            <Trans>Saving...</Trans>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={24} className="mr-2" />
                            <Trans>Yes I have paid</Trans>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Karma Feedback Modal */}
      {
        showKarmaModal && selectedUserId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    <Trans>Rate Participant</Trans>
                  </h3>
                  <button
                    onClick={handleCloseKarmaModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                {/* Report Type Selection */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    <Trans>Feedback Type</Trans>
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reportType"
                        value="none"
                        checked={reportType === 'none'}
                        onChange={(e) => setReportType(e.target.value as any)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        <Trans>Give karma rating</Trans>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reportType"
                        value="no-show"
                        checked={reportType === 'no-show'}
                        onChange={(e) => setReportType(e.target.value as any)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <UserX size={14} className="mr-1 text-red-500" />
                        <Trans>Report no-show</Trans>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reportType"
                        value="bad-behavior"
                        checked={reportType === 'bad-behavior'}
                        onChange={(e) => setReportType(e.target.value as any)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <Flag size={14} className="mr-1 text-red-500" />
                        <Trans>Report bad behavior</Trans>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Karma Rating (only show if not reporting) */}
                {reportType === 'none' && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      <Trans>Rating</Trans>
                    </h4>
                    <div className="flex items-center space-x-2 mb-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setKarmaRating(rating)}
                          className={`p-1 rounded transition-colors ${rating <= karmaRating
                            ? 'text-yellow-500'
                            : 'text-gray-300 hover:text-yellow-400'
                            }`}
                        >
                          <Star
                            size={24}
                            fill={rating <= karmaRating ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      {karmaRating === 1 && i18n._(msg`Poor sportsmanship`)}
                      {karmaRating === 2 && i18n._(msg`Below average`)}
                      {karmaRating === 3 && i18n._(msg`Average player`)}
                      {karmaRating === 4 && i18n._(msg`Good sportsmanship`)}
                      {karmaRating === 5 && i18n._(msg`Excellent player!`)}
                    </div>
                  </div>
                )}

                {/* Comment */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {reportType === 'none'
                      ? i18n._(msg`Comment (optional)`)
                      : i18n._(msg`Details (required)`)}
                  </h4>
                  <textarea
                    value={karmaComment}
                    onChange={(e) => setKarmaComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder={karmaPlaceholder}
                    required={reportType !== 'none'}
                  />
                </div>

                {/* Warning for reports */}
                {reportType !== 'none' && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertTriangle
                        size={16}
                        className="text-red-600 mr-2 mt-0.5 flex-shrink-0"
                      />
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-1">
                          <Trans>Important</Trans>
                        </p>
                        <p>
                          {reportType === 'no-show'
                            ? i18n._(
                              msg`No-show reports will deduct karma points and may affect future event participation.`
                            )
                            : i18n._(
                              msg`Behavior reports are taken seriously and may result in account restrictions.`
                            )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseKarmaModal}
                    className="flex-1"
                    disabled={isSubmittingKarma}
                  >
                    <Trans>Cancel</Trans>
                  </Button>
                  <Button
                    variant={getKarmaButtonVariant(karmaRating, reportType)}
                    onClick={handleSubmitKarma}
                    className="flex-1"
                    disabled={
                      isSubmittingKarma ||
                      (reportType !== 'none' && !karmaComment.trim())
                    }
                  >
                    {isSubmittingKarma ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <Trans>Submitting...</Trans>
                      </div>
                    ) : (
                      getKarmaButtonText(karmaRating, reportType)
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
